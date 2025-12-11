import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { RolloverApiKeyDto } from './dto/rollover-api-key.dto';
import { ApiKeyResponseDto } from './dto/api-key-response.dto';
import { ApiKeyMetadataResponseDto } from './dto/api-key-metadata-response.dto';
import { RevokeApiKeyDto } from './dto/revoke-api-key.dto';
import { RevokeSuccessResponseDto } from './dto/revoke-success-response.dto';

@ApiTags('API Keys')
@Controller('keys')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post('create')
  @ApiOperation({
    summary: 'Create API key',
    description:
      'Create a new API key with specified permissions. Maximum 5 active keys per user. The API key is only shown once during creation - save it securely. Requires JWT authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'API key created successfully',
    type: ApiKeyResponseDto,
    schema: {
      example: {
        api_key:
          'sk_live_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567',
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
    description:
      'Bad Request - Invalid permissions, expiry, or 5-key limit reached',
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
    description:
      'Create a new API key with the same permissions as an expired key. The expired key must belong to the authenticated user. The new key is only shown once - save it securely. Requires JWT authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'API key rolled over successfully',
    type: ApiKeyResponseDto,
    schema: {
      example: {
        api_key:
          'sk_live_xyz789abc012def345ghi678jkl901mno234pqr567stu890vwx123',
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

  @Get()
  @ApiOperation({
    summary: 'Get all API keys',
    description:
      'Retrieve all API keys with metadata for the authenticated user. Optionally filter by status (active/inactive/expired). Returns key metadata only - not the actual key values. Requires JWT authentication.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive', 'expired'],
    description: 'Filter by key status',
    example: 'active',
  })
  @ApiResponse({
    status: 200,
    description: 'API keys retrieved successfully',
    type: [ApiKeyMetadataResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid status parameter',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getAllKeys(
    @CurrentUser() user: RequestUser,
    @Query('status') status?: string,
  ): Promise<ApiKeyMetadataResponseDto[]> {
    if (status && !['active', 'inactive', 'expired'].includes(status)) {
      throw new BadRequestException(
        'Status must be one of: active, inactive, expired',
      );
    }

    const keys = await this.apiKeysService.getAllKeys(user.userId, status);
    const now = new Date();

    return keys.map((key) => {
      let computedStatus: string;
      if (key.isActive && key.expiresAt > now) {
        computedStatus = 'active';
      } else if (key.expiresAt <= now) {
        computedStatus = 'expired';
      } else {
        computedStatus = 'inactive';
      }

      return {
        id: key.id,
        name: key.name,
        key_prefix: key.keyPrefix,
        permissions: key.permissions,
        is_active: key.isActive,
        status: computedStatus,
        expires_at: key.expiresAt,
        last_used_at: key.lastUsedAt,
        created_at: key.createdAt,
      };
    });
  }

  @Post('revoke')
  @ApiOperation({
    summary: 'Revoke an API key',
    description:
      'Revoke an active API key by setting its status to inactive. The key must belong to the authenticated user. Revoked keys cannot be used for authentication. Requires JWT authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'API key revoked successfully',
    type: RevokeSuccessResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Key is already inactive or invalid key ID',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'API key not found or does not belong to user',
  })
  async revokeApiKey(
    @CurrentUser() user: RequestUser,
    @Body() revokeDto: RevokeApiKeyDto,
  ): Promise<RevokeSuccessResponseDto> {
    await this.apiKeysService.revokeApiKey(user.userId, revokeDto.key_id);

    return {
      message: 'API key revoked successfully',
      key_id: revokeDto.key_id,
    };
  }
}
