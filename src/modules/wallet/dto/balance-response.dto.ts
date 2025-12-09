import { ApiProperty } from '@nestjs/swagger';

export class BalanceResponseDto {
  @ApiProperty({
    description: 'Current wallet balance',
    example: 15000.50,
    type: Number,
  })
  balance: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'NGN',
    required: false,
  })
  currency?: string;

  @ApiProperty({
    description: 'Unique 13-digit wallet number',
    example: '4123456789012',
    required: false,
  })
  walletNumber?: string;
}
