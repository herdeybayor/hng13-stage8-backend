import { IsString, IsArray, IsEnum, ArrayMinSize, MaxLength, IsIn } from 'class-validator';
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
    description: 'Expiry duration (1H, 1D, 1M, 1Y)',
    example: '1Y',
    enum: ['1H', '1D', '1M', '1Y'],
  })
  @IsString()
  @IsIn(['1H', '1D', '1M', '1Y'], { message: 'Expiry must be one of: 1H, 1D, 1M, 1Y' })
  expiry: string;
}
