import { IsString, IsNumber, IsObject, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class WebhookDataDto {
  @ApiProperty({ example: 123456 })
  @IsNumber()
  id: number;

  @ApiProperty({ example: 'success' })
  @IsString()
  status: string;

  @ApiProperty({ example: 'ref_abc123xyz' })
  @IsString()
  reference: string;

  @ApiProperty({ example: 500000 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'user@example.com' })
  @IsString()
  customer: {
    email: string;
  };

  @ApiProperty({ example: {} })
  @IsObject()
  metadata: Record<string, any>;
}

export class WebhookPayloadDto {
  @ApiProperty({ example: 'charge.success' })
  @IsString()
  event: string;

  @ApiProperty({ type: WebhookDataDto })
  @ValidateNested()
  @Type(() => WebhookDataDto)
  data: WebhookDataDto;
}
