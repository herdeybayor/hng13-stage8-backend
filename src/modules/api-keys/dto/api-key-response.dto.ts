import { ApiProperty } from '@nestjs/swagger';

export class ApiKeyResponseDto {
  @ApiProperty({
    description: 'The generated API key (ONLY shown once during creation)',
    example: 'sk_live_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567',
  })
  api_key: string;

  @ApiProperty({
    description: 'API key ID',
    example: 'uuid-here',
  })
  id: string;

  @ApiProperty({
    description: 'API key name',
    example: 'Production API Key',
  })
  name: string;

  @ApiProperty({
    description: 'Permissions assigned to this key',
    example: ['deposit', 'transfer', 'read'],
    isArray: true,
  })
  permissions: string[];

  @ApiProperty({
    description: 'Expiration timestamp',
    example: '2026-12-09T10:00:00Z',
    type: Date,
  })
  expires_at: Date;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-12-09T10:00:00Z',
    type: Date,
  })
  created_at: Date;
}
