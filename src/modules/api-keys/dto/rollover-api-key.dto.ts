import { IsString, IsUUID, Matches } from 'class-validator';
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
    description: 'Expiry duration in format: <number><unit> where unit is H (hours), D (days), M (months), or Y (years). Case-insensitive.',
    example: '1Y',
    pattern: '^\\d+[HhDdMmYy]$',
  })
  @IsString()
  @Matches(/^\d+[HhDdMmYy]$/, {
    message: 'Expiry must be in format: <number><unit> (e.g., 3D, 5H, 10M, 2Y)',
  })
  expiry: string;
}
