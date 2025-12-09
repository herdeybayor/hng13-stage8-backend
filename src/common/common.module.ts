import { Module, Global } from '@nestjs/common';
import { CombinedAuthGuard } from './guards/combined-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { ApiKeysModule } from '../modules/api-keys/api-keys.module';

@Global()
@Module({
  imports: [ApiKeysModule],
  providers: [CombinedAuthGuard, PermissionsGuard],
  exports: [CombinedAuthGuard, PermissionsGuard],
})
export class CommonModule {}
