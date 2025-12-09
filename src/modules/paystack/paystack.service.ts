import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

interface PaystackInitializeData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

interface PaystackVerifyData {
  id: number;
  status: string;
  reference: string;
  amount: number;
  customer: {
    email: string;
  };
  metadata: Record<string, any>;
}

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly baseUrl: string;
  private readonly secretKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('paystack.baseUrl')!;
    this.secretKey = this.configService.get<string>('paystack.secretKey')!;
  }

  /**
   * Initialize a Paystack transaction
   * @param email - User's email address
   * @param amount - Amount in kobo (smallest currency unit)
   * @param metadata - Additional transaction metadata
   * @returns Paystack authorization URL and reference
   */
  async initializeTransaction(
    email: string,
    amount: number,
    metadata: Record<string, any> = {},
  ): Promise<PaystackInitializeData> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/transaction/initialize`,
          {
            email,
            amount,
            metadata,
          },
          {
            headers: {
              Authorization: `Bearer ${this.secretKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.logger.log(`Transaction initialized: ${response.data.data.reference}`);
      return response.data.data;
    } catch (error) {
      this.logger.error('Failed to initialize transaction', error);

      if (error instanceof AxiosError) {
        throw new InternalServerErrorException(
          `Paystack error: ${error.response?.data?.message || error.message}`,
        );
      }

      throw new InternalServerErrorException('Failed to initialize payment');
    }
  }

  /**
   * Verify a Paystack transaction
   * @param reference - Payment reference
   * @returns Transaction verification data
   */
  async verifyTransaction(reference: string): Promise<PaystackVerifyData> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/transaction/verify/${reference}`,
          {
            headers: {
              Authorization: `Bearer ${this.secretKey}`,
            },
          },
        ),
      );

      this.logger.log(`Transaction verified: ${reference}`);
      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to verify transaction: ${reference}`, error);

      if (error instanceof AxiosError) {
        throw new InternalServerErrorException(
          `Paystack error: ${error.response?.data?.message || error.message}`,
        );
      }

      throw new InternalServerErrorException('Failed to verify payment');
    }
  }

  /**
   * Get Paystack secret key for signature validation
   */
  getSecretKey(): string {
    return this.secretKey;
  }
}
