import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { PaystackController } from './paystack.controller';
import { PaystackService } from './paystack.service';
import { IdempotencyKey } from './entities/idempotency-key.entity';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([IdempotencyKey]),
    HttpModule,
    WalletModule, // Import WalletModule to use WalletService
  ],
  controllers: [PaystackController],
  providers: [PaystackService],
  exports: [PaystackService],
})
export class PaystackModule {}
