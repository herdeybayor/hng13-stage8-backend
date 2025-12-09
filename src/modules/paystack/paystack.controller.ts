import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Headers,
  Req,
  UnauthorizedException,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
  ApiParam,
} from '@nestjs/swagger';
import { PaystackService } from './paystack.service';
import { WalletService } from '../wallet/wallet.service';
import { CombinedAuthGuard } from '../../common/guards/combined-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/types/permission.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { DepositDto } from './dto/deposit.dto';
import { InitializeResponseDto } from './dto/initialize-response.dto';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';
import { DepositStatusResponseDto } from './dto/deposit-status-response.dto';
import { SignatureValidator } from './utils/signature-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IdempotencyKey } from './entities/idempotency-key.entity';
import type { Request } from 'express';

@ApiTags('Deposits')
@Controller('wallet')
export class PaystackController {
  private readonly logger = new Logger(PaystackController.name);

  constructor(
    private readonly paystackService: PaystackService,
    private readonly walletService: WalletService,
    @InjectRepository(IdempotencyKey)
    private readonly idempotencyKeyRepository: Repository<IdempotencyKey>,
  ) {}

  @Post('deposit')
  @UseGuards(CombinedAuthGuard, PermissionsGuard)
  @Permissions(Permission.DEPOSIT)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('API-Key')
  @ApiOperation({
    summary: 'Initialize deposit',
    description: 'Initialize a Paystack deposit transaction. Returns a payment URL that the user should visit to complete the payment. Requires JWT token or API key with "deposit" permission.',
  })
  @ApiResponse({
    status: 200,
    description: 'Deposit initialized successfully',
    type: InitializeResponseDto,
    schema: {
      example: {
        authorization_url: 'https://checkout.paystack.com/abc123xyz',
        access_code: 'abc123xyz',
        reference: 'ref_abc123xyz',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid deposit amount',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication',
  })
  @ApiResponse({
    status: 404,
    description: 'Wallet not found',
  })
  async initializeDeposit(
    @CurrentUser() user: RequestUser,
    @Body() depositDto: DepositDto,
  ): Promise<InitializeResponseDto> {
    // Initialize Paystack transaction
    const paystackData = await this.paystackService.initializeTransaction(
      user.email,
      depositDto.amount,
      { userId: user.userId },
    );

    // Create pending transaction in database
    await this.walletService.createPendingDeposit(
      user.userId,
      depositDto.amount,
      paystackData.reference,
    );

    this.logger.log(`Deposit initialized for user ${user.userId}: ${paystackData.reference}`);

    return {
      authorization_url: paystackData.authorization_url,
      access_code: paystackData.access_code,
      reference: paystackData.reference,
    };
  }

  @Post('paystack/webhook')
  @ApiOperation({
    summary: 'Paystack webhook',
    description: 'Handles Paystack payment webhooks. This endpoint validates the webhook signature, checks for idempotency, and credits the user wallet atomically. NO AUTHENTICATION REQUIRED - validated via signature.',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid webhook payload or signature',
  })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-paystack-signature') signature: string,
    @Body() payload: WebhookPayloadDto,
  ): Promise<{ message: string }> {
    this.logger.log(`Webhook received: ${payload.event}`);

    // 1. Validate signature
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Raw body required for signature validation');
    }

    const secretKey = this.paystackService.getSecretKey();
    const isValid = SignatureValidator.validateSignature(rawBody, signature, secretKey);

    if (!isValid) {
      this.logger.error('Invalid webhook signature');
      throw new UnauthorizedException('Invalid signature');
    }

    // 2. Only process successful charge events
    if (payload.event !== 'charge.success') {
      this.logger.log(`Ignoring event: ${payload.event}`);
      return { message: 'Event ignored' };
    }

    const { reference, amount } = payload.data;

    // 3. Check idempotency (prevent double-crediting)
    const existingKey = await this.idempotencyKeyRepository.findOne({
      where: { key: reference },
    });

    if (existingKey) {
      this.logger.log(`Duplicate webhook for reference: ${reference}`);
      return existingKey.response as { message: string };
    }

    try {
      // 4. Credit wallet atomically
      const transaction = await this.walletService.creditWallet(reference, amount);

      // 5. Store idempotency key
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Keep for 30 days

      const idempotencyKey = this.idempotencyKeyRepository.create({
        key: reference,
        response: { message: 'Wallet credited successfully', transactionId: transaction.id },
        expiresAt,
      });
      await this.idempotencyKeyRepository.save(idempotencyKey);

      this.logger.log(`Wallet credited for reference: ${reference}`);

      return { message: 'Wallet credited successfully' };
    } catch (error) {
      this.logger.error(`Failed to process webhook: ${reference}`, error);

      // Store failed attempt to prevent retry
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Keep failed for 7 days

      const idempotencyKey = this.idempotencyKeyRepository.create({
        key: reference,
        response: { message: 'Processing failed', error: (error as Error).message },
        expiresAt,
      });
      await this.idempotencyKeyRepository.save(idempotencyKey);

      throw error;
    }
  }

  @Get('deposit/:reference/status')
  @UseGuards(CombinedAuthGuard, PermissionsGuard)
  @Permissions(Permission.READ)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('API-Key')
  @ApiParam({
    name: 'reference',
    description: 'Payment reference',
    example: 'ref_abc123xyz',
  })
  @ApiOperation({
    summary: 'Check deposit status',
    description: 'Check the status of a deposit transaction by reference. This is READ-ONLY and does NOT credit the wallet. Requires JWT token or API key with "read" permission.',
  })
  @ApiResponse({
    status: 200,
    description: 'Deposit status retrieved successfully',
    type: DepositStatusResponseDto,
    schema: {
      example: {
        reference: 'ref_abc123xyz',
        status: 'success',
        amount: 5000,
        createdAt: '2025-12-09T10:00:00Z',
        balanceAfter: 15000,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication',
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
  })
  async getDepositStatus(
    @Param('reference') reference: string,
  ): Promise<DepositStatusResponseDto> {
    const transaction = await this.walletService.findTransactionByReference(reference);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      reference: transaction.reference!,
      status: transaction.status,
      amount: Number(transaction.amount),
      createdAt: transaction.createdAt,
      balanceAfter: transaction.balanceAfter ? Number(transaction.balanceAfter) : undefined,
    };
  }
}
