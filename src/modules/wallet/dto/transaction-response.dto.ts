import { ApiProperty } from '@nestjs/swagger';
import { TransactionType, TransactionStatus } from '../entities/transaction.entity';

export class TransactionResponseDto {
  @ApiProperty({
    description: 'Transaction ID',
    example: 'uuid-here',
  })
  id: string;

  @ApiProperty({
    description: 'Transaction type',
    enum: TransactionType,
    example: TransactionType.DEPOSIT,
  })
  type: TransactionType;

  @ApiProperty({
    description: 'Transaction amount',
    example: 5000,
    type: Number,
  })
  amount: number;

  @ApiProperty({
    description: 'Transaction status',
    enum: TransactionStatus,
    example: TransactionStatus.SUCCESS,
  })
  status: TransactionStatus;

  @ApiProperty({
    description: 'Payment reference (for deposits)',
    example: 'ref_abc123',
    required: false,
  })
  reference?: string;

  @ApiProperty({
    description: 'Additional transaction metadata',
    example: { recipientWalletNumber: '4987654321098' },
    required: false,
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Wallet balance before transaction',
    example: 10000,
    required: false,
    type: Number,
  })
  balanceBefore?: number;

  @ApiProperty({
    description: 'Wallet balance after transaction',
    example: 15000,
    required: false,
    type: Number,
  })
  balanceAfter?: number;

  @ApiProperty({
    description: 'Transaction creation timestamp',
    example: '2025-12-09T10:00:00Z',
    type: Date,
  })
  createdAt: Date;
}
