import { ApiProperty } from '@nestjs/swagger';

export class ApiKeyMetadataResponseDto {
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
    description: 'Key prefix for identification (sk_live_xxxxx...)',
    example: 'sk_live_abc12345...',
  })
  key_prefix: string;

  @ApiProperty({
    description: 'Permissions assigned to this key',
    example: ['deposit', 'transfer', 'read'],
    isArray: true,
  })
  permissions: string[];

  @ApiProperty({
    description: 'Whether the key is active',
    example: true,
  })
  is_active: boolean;

  @ApiProperty({
    description: 'Key status (active/inactive/expired)',
    example: 'active',
    enum: ['active', 'inactive', 'expired'],
  })
  status: string;

  @ApiProperty({
    description: 'Expiration timestamp',
    example: '2026-12-09T10:00:00Z',
    type: Date,
  })
  expires_at: Date;

  @ApiProperty({
    description: 'Last time the key was used',
    example: '2025-12-10T14:30:00Z',
    type: Date,
    nullable: true,
  })
  last_used_at: Date | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-12-09T10:00:00Z',
    type: Date,
  })
  created_at: Date;
}
