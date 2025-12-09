import { IsString, IsNumber, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class WebhookDataDto {
  @ApiPropertyOptional({ example: 123456 })
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiProperty({ example: 'success' })
  @IsString()
  status: string;

  @ApiProperty({ example: 'ref_abc123xyz' })
  @IsString()
  reference: string;

  @ApiProperty({ example: 500000 })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ example: { email: 'user@example.com' } })
  @IsObject()
  @IsOptional()
  customer?: any;

  @ApiPropertyOptional({ example: {} })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  // Allow all other Paystack fields without validation
  [key: string]: any;
}

export class WebhookPayloadDto {
  @ApiProperty({ example: 'charge.success' })
  @IsString()
  event: string;

  @ApiProperty({ type: WebhookDataDto })
  @IsObject()
  data: WebhookDataDto;
}
