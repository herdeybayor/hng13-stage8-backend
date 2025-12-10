import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DepositDto {
  @ApiProperty({
    description: 'Deposit amount in NGN (Naira). Decimals allowed for kobo precision.',
    example: 5000,
    minimum: 1,
    maximum: 100000,
  })
  @IsNumber()
  @Min(1, { message: 'Minimum deposit amount is 1 NGN' })
  @Max(100000, { message: 'Maximum deposit amount is 100,000 NGN' })
  amount: number;
}
