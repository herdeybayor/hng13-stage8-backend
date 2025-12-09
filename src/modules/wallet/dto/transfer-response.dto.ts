import { ApiProperty } from '@nestjs/swagger';

export class TransferResponseDto {
  @ApiProperty({
    description: 'Transaction ID for sender',
    example: 'uuid-here',
  })
  senderTransactionId: string;

  @ApiProperty({
    description: 'Transaction ID for recipient',
    example: 'uuid-here-2',
  })
  recipientTransactionId: string;

  @ApiProperty({
    description: 'Transfer amount',
    example: 3000,
    type: Number,
  })
  amount: number;

  @ApiProperty({
    description: 'Recipient wallet number',
    example: '4987654321098',
  })
  recipientWalletNumber: string;

  @ApiProperty({
    description: 'Sender balance after transfer',
    example: 12000,
    type: Number,
  })
  senderBalanceAfter: number;

  @ApiProperty({
    description: 'Timestamp when transfer was completed',
    example: '2025-12-09T11:00:00Z',
    type: Date,
  })
  createdAt: Date;
}
