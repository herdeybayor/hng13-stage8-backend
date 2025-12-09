import { IsString, IsNumber, Min, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferDto {
  @ApiProperty({
    description: '13-digit wallet number of the recipient',
    example: '4987654321098',
    minLength: 13,
    maxLength: 13,
  })
  @IsString()
  @Length(13, 13, { message: 'Wallet number must be exactly 13 digits' })
  wallet_number: string;

  @ApiProperty({
    description: 'Transfer amount in the smallest currency unit (kobo for NGN)',
    example: 300000,
    minimum: 1,
  })
  @IsNumber()
  @Min(1, { message: 'Transfer amount must be at least 1' })
  amount: number;
}
