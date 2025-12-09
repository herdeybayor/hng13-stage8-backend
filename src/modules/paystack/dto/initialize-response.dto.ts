import { ApiProperty } from '@nestjs/swagger';

export class InitializeResponseDto {
  @ApiProperty({
    description: 'Paystack authorization URL for completing payment',
    example: 'https://checkout.paystack.com/abc123xyz',
  })
  authorization_url: string;

  @ApiProperty({
    description: 'Paystack access code',
    example: 'abc123xyz',
  })
  access_code: string;

  @ApiProperty({
    description: 'Payment reference for tracking',
    example: 'ref_abc123xyz',
  })
  reference: string;
}
