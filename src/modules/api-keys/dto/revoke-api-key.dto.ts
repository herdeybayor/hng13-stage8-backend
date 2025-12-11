import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RevokeApiKeyDto {
  @ApiProperty({
    description: 'UUID of the API key to revoke',
    example: 'uuid-here',
  })
  @IsString()
  @IsUUID()
  key_id: string;
}
