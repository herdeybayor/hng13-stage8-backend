import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeysService } from '../../modules/api-keys/api-keys.service';

@Injectable()
export class CombinedAuthGuard implements CanActivate {
  private jwtAuthGuard = new (AuthGuard('jwt'))();

  constructor(private readonly apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Check for JWT in Authorization header
    const hasJwt = request.headers.authorization?.startsWith('Bearer ');

    // Check for API key in x-api-key header
    const apiKeyHeader = request.headers['x-api-key'];
    const hasApiKey = !!apiKeyHeader;

    if (hasJwt) {
      // Use JWT authentication
      try {
        return (await this.jwtAuthGuard.canActivate(context)) as boolean;
      } catch (error) {
        throw new UnauthorizedException('Invalid or expired JWT token');
      }
    } else if (hasApiKey) {
      // Validate API key
      const apiKey = await this.apiKeysService.validateApiKey(apiKeyHeader);

      if (!apiKey) {
        throw new UnauthorizedException('Invalid or expired API key');
      }

      // Attach user info to request
      request.user = {
        userId: apiKey.userId,
        email: apiKey.user.email,
        authMethod: 'api_key',
        permissions: apiKey.permissions,
      };

      return true;
    } else {
      throw new UnauthorizedException('No authentication credentials provided');
    }
  }
}
