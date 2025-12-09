import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { RolloverApiKeyDto } from './dto/rollover-api-key.dto';
import { ApiKeyResponseDto } from './dto/api-key-response.dto';

@ApiTags('API Keys')
@Controller('keys')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post('create')
  @ApiOperation({
    summary: 'Create API key',
    description: 'Create a new API key with specified permissions. Maximum 5 active keys per user. The API key is only shown once during creation - save it securely. Requires JWT authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'API key created successfully',
    type: ApiKeyResponseDto,
    schema: {
      example: {
        api_key: 'sk_live_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567',
        id: 'uuid-here',
        name: 'Production API Key',
        permissions: ['deposit', 'transfer', 'read'],
        expires_at: '2026-12-09T10:00:00Z',
        created_at: '2025-12-09T10:00:00Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid permissions, expiry, or 5-key limit reached',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async createApiKey(
    @CurrentUser() user: RequestUser,
    @Body() createDto: CreateApiKeyDto,
  ): Promise<ApiKeyResponseDto> {
    const [apiKey, plainKey] = await this.apiKeysService.createApiKey(
      user.userId,
      createDto.name,
      createDto.permissions,
      createDto.expiry,
    );

    return {
      api_key: plainKey,
      id: apiKey.id,
      name: apiKey.name,
      permissions: apiKey.permissions,
      expires_at: apiKey.expiresAt,
      created_at: apiKey.createdAt,
    };
  }

  @Post('rollover')
  @ApiOperation({
    summary: 'Rollover expired API key',
    description: 'Create a new API key with the same permissions as an expired key. The expired key must belong to the authenticated user. The new key is only shown once - save it securely. Requires JWT authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'API key rolled over successfully',
    type: ApiKeyResponseDto,
    schema: {
      example: {
        api_key: 'sk_live_xyz789abc012def345ghi678jkl901mno234pqr567stu890vwx123',
        id: 'uuid-new',
        name: 'Production API Key',
        permissions: ['deposit', 'transfer', 'read'],
        expires_at: '2026-12-09T10:00:00Z',
        created_at: '2025-12-09T10:00:00Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Key is not expired or invalid expiry format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Expired API key not found',
  })
  async rolloverApiKey(
    @CurrentUser() user: RequestUser,
    @Body() rolloverDto: RolloverApiKeyDto,
  ): Promise<ApiKeyResponseDto> {
    const [apiKey, plainKey] = await this.apiKeysService.rolloverApiKey(
      user.userId,
      rolloverDto.expired_key_id,
      rolloverDto.expiry,
    );

    return {
      api_key: plainKey,
      id: apiKey.id,
      name: apiKey.name,
      permissions: apiKey.permissions,
      expires_at: apiKey.expiresAt,
      created_at: apiKey.createdAt,
    };
  }
}
