import { ApiProperty } from '@nestjs/swagger';
import { TransactionStatus } from '../../wallet/entities/transaction.entity';

export class DepositStatusResponseDto {
  @ApiProperty({
    description: 'Payment reference',
    example: 'ref_abc123xyz',
  })
  reference: string;

  @ApiProperty({
    description: 'Transaction status',
    enum: TransactionStatus,
    example: TransactionStatus.SUCCESS,
  })
  status: TransactionStatus;

  @ApiProperty({
    description: 'Deposit amount in NGN (Naira)',
    example: 50,
    type: Number,
  })
  amount: number;

  @ApiProperty({
    description: 'Transaction creation timestamp',
    example: '2025-12-09T10:00:00Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Wallet balance after transaction (if successful) in NGN (Naira)',
    example: 150,
    required: false,
    type: Number,
  })
  balanceAfter?: number;
}
