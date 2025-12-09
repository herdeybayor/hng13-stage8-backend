import { IsString, IsUUID, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RolloverApiKeyDto {
  @ApiProperty({
    description: 'UUID of the expired API key to rollover',
    example: 'uuid-here',
  })
  @IsString()
  @IsUUID()
  expired_key_id: string;

  @ApiProperty({
    description: 'Expiry duration for the new key (1H, 1D, 1M, 1Y)',
    example: '1Y',
    enum: ['1H', '1D', '1M', '1Y'],
  })
  @IsString()
  @IsIn(['1H', '1D', '1M', '1Y'], { message: 'Expiry must be one of: 1H, 1D, 1M, 1Y' })
  expiry: string;
}
