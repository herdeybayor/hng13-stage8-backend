import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DepositDto {
  @ApiProperty({
    description: 'Deposit amount in the smallest currency unit (kobo for NGN)',
    example: 500000,
    minimum: 100,
    maximum: 10000000,
  })
  @IsNumber()
  @Min(100, { message: 'Minimum deposit amount is 100 (1 NGN)' })
  @Max(10000000, { message: 'Maximum deposit amount is 10,000,000 (100,000 NGN)' })
  amount: number;
}
