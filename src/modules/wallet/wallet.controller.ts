import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity, ApiQuery } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { CombinedAuthGuard } from '../../common/guards/combined-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/types/permission.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { BalanceResponseDto } from './dto/balance-response.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { TransferDto } from './dto/transfer.dto';
import { TransferResponseDto } from './dto/transfer-response.dto';

@ApiTags('Wallet')
@Controller('wallet')
@UseGuards(CombinedAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
@ApiSecurity('API-Key')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  @Permissions(Permission.READ)
  @ApiOperation({
    summary: 'Get wallet balance',
    description: 'Retrieve the current balance and wallet number for the authenticated user. Requires JWT token or API key with "read" permission.',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet balance retrieved successfully',
    type: BalanceResponseDto,
    schema: {
      example: {
        balance: 15000.50,
        walletNumber: '4123456789012',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication',
  })
  @ApiResponse({
    status: 404,
    description: 'Wallet not found',
  })
  async getBalance(@CurrentUser() user: RequestUser): Promise<BalanceResponseDto> {
    const { balance, walletNumber } = await this.walletService.getBalance(user.userId);

    return {
      balance,
      walletNumber,
    };
  }

  @Get('transactions')
  @Permissions(Permission.READ)
  @ApiOperation({
    summary: 'Get transaction history',
    description: 'Retrieve paginated transaction history for the authenticated user. Includes deposits, transfers, and other wallet activities. Requires JWT token or API key with "read" permission.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of transactions to return (default: 50)',
    example: 50,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of transactions to skip (default: 0)',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction history retrieved successfully',
    type: [TransactionResponseDto],
    schema: {
      example: [
        {
          id: 'uuid-here',
          type: 'deposit',
          amount: 5000,
          status: 'success',
          reference: 'ref_abc123',
          metadata: null,
          balanceBefore: 10000,
          balanceAfter: 15000,
          createdAt: '2025-12-09T10:00:00Z',
        },
        {
          id: 'uuid-here-2',
          type: 'transfer_out',
          amount: 3000,
          status: 'success',
          reference: null,
          metadata: {
            recipientWalletNumber: '4987654321098',
            recipientEmail: 'recipient@example.com',
          },
          balanceBefore: 15000,
          balanceAfter: 12000,
          createdAt: '2025-12-09T11:00:00Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication',
  })
  @ApiResponse({
    status: 404,
    description: 'Wallet not found',
  })
  async getTransactions(
    @CurrentUser() user: RequestUser,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<TransactionResponseDto[]> {
    const transactions = await this.walletService.getTransactionHistory(
      user.userId,
      limit || 50,
      offset || 0,
    );

    return transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: Number(tx.amount),
      status: tx.status,
      reference: tx.reference,
      metadata: tx.metadata,
      balanceBefore: tx.balanceBefore ? Number(tx.balanceBefore) : undefined,
      balanceAfter: tx.balanceAfter ? Number(tx.balanceAfter) : undefined,
      createdAt: tx.createdAt,
    }));
  }

  @Post('transfer')
  @Permissions(Permission.TRANSFER)
  @ApiOperation({
    summary: 'Transfer funds to another wallet',
    description: 'Transfer funds atomically to another wallet using the recipient\'s 13-digit wallet number. The transaction is atomic - both accounts are locked, debited/credited, and transaction records created in a single database transaction. Prevents race conditions and partial transfers. Requires JWT token or API key with "transfer" permission.',
  })
  @ApiResponse({
    status: 200,
    description: 'Transfer completed successfully',
    type: TransferResponseDto,
    schema: {
      example: {
        senderTransactionId: 'uuid-here',
        recipientTransactionId: 'uuid-here-2',
        amount: 3000,
        recipientWalletNumber: '4987654321098',
        senderBalanceAfter: 12000,
        createdAt: '2025-12-09T11:00:00Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Insufficient balance, invalid wallet number, or self-transfer',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication',
  })
  @ApiResponse({
    status: 404,
    description: 'Sender or recipient wallet not found',
  })
  async transfer(
    @CurrentUser() user: RequestUser,
    @Body() transferDto: TransferDto,
  ): Promise<TransferResponseDto> {
    const { senderTransaction, recipientTransaction } = await this.walletService.transferFunds(
      user.userId,
      transferDto.wallet_number,
      transferDto.amount,
    );

    return {
      senderTransactionId: senderTransaction.id,
      recipientTransactionId: recipientTransaction.id,
      amount: Number(senderTransaction.amount),
      recipientWalletNumber: transferDto.wallet_number,
      senderBalanceAfter: Number(senderTransaction.balanceAfter),
      createdAt: senderTransaction.createdAt,
    };
  }
}
