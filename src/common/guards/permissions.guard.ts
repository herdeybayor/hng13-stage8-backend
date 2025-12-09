import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Permission } from '../types/permission.enum';
import type { RequestUser } from '../decorators/current-user.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      // No permissions required, allow access
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: RequestUser = request.user;

    // JWT users have all permissions
    if (user.authMethod === 'jwt') {
      return true;
    }

    // API key users need to have the required permissions
    if (user.authMethod === 'api_key') {
      const hasPermission = requiredPermissions.some((permission) =>
        user.permissions?.includes(permission),
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          `Missing required permission(s): ${requiredPermissions.join(', ')}`,
        );
      }

      return true;
    }

    // Unknown auth method
    throw new ForbiddenException('Invalid authentication method');
  }
}
