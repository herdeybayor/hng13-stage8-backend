import {
  IsString,
  IsArray,
  IsEnum,
  ArrayMinSize,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Permission } from '../../../common/types/permission.enum';

export class CreateApiKeyDto {
  @ApiProperty({
    description: 'Name for the API key',
    example: 'Production API Key',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Permissions for the API key',
    example: ['deposit', 'transfer', 'read'],
    enum: Permission,
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one permission is required' })
  @IsEnum(Permission, { each: true })
  permissions: Permission[];

  @ApiProperty({
    description:
      'Expiry duration in format: <number><unit> where unit is H (hours), D (days), M (months), or Y (years). Case-insensitive.',
    example: '1Y',
    pattern: '^\\d+[HhDdMmYy]$',
  })
  @IsString()
  @Matches(/^\d+[HhDdMmYy]$/, {
    message: 'Expiry must be in format: <number><unit> (e.g., 3D, 5H, 10M, 2Y)',
  })
  expiry: string;
}
