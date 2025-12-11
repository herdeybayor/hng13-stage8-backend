import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { ApiKey } from './entities/api-key.entity';
import { Permission } from '../../common/types/permission.enum';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
  ) {}

  /**
   * Generate a secure API key
   * @returns Tuple of [plainKey, keyPrefix, keyHash]
   */
  private async generateApiKey(): Promise<[string, string, string]> {
    // Generate 64 hex characters (32 bytes)
    const randomPart = crypto.randomBytes(32).toString('hex');
    const plainKey = `sk_live_${randomPart}`;

    // Create display prefix
    const keyPrefix = `sk_live_${randomPart.substring(0, 8)}...`;

    // Hash the key
    const keyHash = await bcrypt.hash(plainKey, 10);

    return [plainKey, keyPrefix, keyHash];
  }

  /**
   * Calculate expiry timestamp from expiry string
   * @param expiry - Expiry string in format <number><unit> (e.g., 3D, 5H, 10M, 2Y)
   * @returns Expiry Date
   */
  private calculateExpiry(expiry: string): Date {
    // Parse format: <number><unit> where unit is H/h, D/d, M/m, Y/y
    const regex = /^(\d+)([HhDdMmYy])$/;
    const match = expiry.match(regex);

    if (!match) {
      throw new BadRequestException(
        'Invalid expiry format. Expected format: <number><unit> (e.g., 3D, 5H, 10M, 2Y)',
      );
    }

    const value = parseInt(match[1], 10);
    const unit = match[2].toUpperCase();

    const now = new Date();

    switch (unit) {
      case 'H':
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'D':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      case 'M':
        return new Date(now.setMonth(now.getMonth() + value));
      case 'Y':
        return new Date(now.setFullYear(now.getFullYear() + value));
      default:
        throw new BadRequestException('Invalid expiry unit');
    }
  }

  /**
   * Count active API keys for a user
   * @param userId - User ID
   * @returns Number of active keys
   */
  async countActiveKeys(userId: string): Promise<number> {
    return this.apiKeyRepository.count({
      where: {
        userId,
        isActive: true,
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  /**
   * Create a new API key
   * @param userId - User ID
   * @param name - Key name
   * @param permissions - Permissions array
   * @param expiry - Expiry string
   * @returns Tuple of [apiKey entity, plainKey]
   */
  async createApiKey(
    userId: string,
    name: string,
    permissions: Permission[],
    expiry: string,
  ): Promise<[ApiKey, string]> {
    // Check 5-key limit
    const activeCount = await this.countActiveKeys(userId);
    if (activeCount >= 5) {
      throw new BadRequestException('Maximum of 5 active API keys allowed');
    }

    // Generate key
    const [plainKey, keyPrefix, keyHash] = await this.generateApiKey();

    // Calculate expiry
    const expiresAt = this.calculateExpiry(expiry);

    // Create entity
    const apiKey = this.apiKeyRepository.create({
      userId,
      name,
      keyHash,
      keyPrefix,
      permissions,
      isActive: true,
      expiresAt,
      lastUsedAt: null,
    });

    await this.apiKeyRepository.save(apiKey);

    return [apiKey, plainKey];
  }

  /**
   * Rollover an expired API key
   * @param userId - User ID
   * @param expiredKeyId - Expired key ID
   * @param newExpiry - New expiry string
   * @returns Tuple of [new apiKey entity, plainKey]
   */
  async rolloverApiKey(
    userId: string,
    expiredKeyId: string,
    newExpiry: string,
  ): Promise<[ApiKey, string]> {
    // Find expired key
    const expiredKey = await this.apiKeyRepository.findOne({
      where: { id: expiredKeyId, userId },
    });

    if (!expiredKey) {
      throw new NotFoundException('API key not found');
    }

    // Verify it's expired
    if (expiredKey.expiresAt > new Date()) {
      throw new BadRequestException('API key is not expired yet');
    }

    // Generate new key with same permissions
    const [plainKey, keyPrefix, keyHash] = await this.generateApiKey();
    const expiresAt = this.calculateExpiry(newExpiry);

    // Create new key
    const newApiKey = this.apiKeyRepository.create({
      userId,
      name: expiredKey.name,
      keyHash,
      keyPrefix,
      permissions: expiredKey.permissions,
      isActive: true,
      expiresAt,
      lastUsedAt: null,
    });

    await this.apiKeyRepository.save(newApiKey);

    // Mark old key as inactive
    expiredKey.isActive = false;
    await this.apiKeyRepository.save(expiredKey);

    return [newApiKey, plainKey];
  }

  /**
   * Validate an API key and return the associated user info
   * @param plainKey - Plain text API key
   * @returns API key entity with user info and permissions
   */
  async validateApiKey(plainKey: string): Promise<ApiKey | null> {
    // API keys start with sk_live_
    if (!plainKey.startsWith('sk_live_')) {
      throw new UnauthorizedException('Invalid API key format');
    }

    // Find all active keys (we need to check hash)
    const activeKeys = await this.apiKeyRepository.find({
      where: {
        isActive: true,
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    // Check each key's hash
    for (const key of activeKeys) {
      const isMatch = await bcrypt.compare(plainKey, key.keyHash);
      if (isMatch) {
        // Update last used timestamp
        key.lastUsedAt = new Date();
        await this.apiKeyRepository.save(key);

        return key;
      }
    }

    return null;
  }

  /**
   * Get all API keys for a user with optional status filtering
   * @param userId - User ID
   * @param statusFilter - Optional status filter (active/inactive/expired)
   * @returns Array of API keys
   */
  async getAllKeys(userId: string, statusFilter?: string): Promise<ApiKey[]> {
    const queryBuilder = this.apiKeyRepository
      .createQueryBuilder('apiKey')
      .where('apiKey.userId = :userId', { userId })
      .orderBy('apiKey.createdAt', 'DESC');

    const now = new Date();

    if (statusFilter === 'active') {
      queryBuilder
        .andWhere('apiKey.isActive = :isActive', { isActive: true })
        .andWhere('apiKey.expiresAt > :now', { now });
    } else if (statusFilter === 'inactive') {
      queryBuilder.andWhere('apiKey.isActive = :isActive', { isActive: false });
    } else if (statusFilter === 'expired') {
      queryBuilder.andWhere('apiKey.expiresAt <= :now', { now });
    }

    return queryBuilder.getMany();
  }

  /**
   * Revoke an API key
   * @param userId - User ID
   * @param keyId - API key ID to revoke
   * @returns Revoked API key entity
   */
  async revokeApiKey(userId: string, keyId: string): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id: keyId, userId },
    });

    if (!apiKey) {
      throw new NotFoundException(
        'API key not found or does not belong to the user',
      );
    }

    if (!apiKey.isActive) {
      throw new BadRequestException('API key is already inactive');
    }

    apiKey.isActive = false;
    await this.apiKeyRepository.save(apiKey);

    return apiKey;
  }
}
