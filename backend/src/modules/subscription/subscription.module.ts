import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { PremiumGuard } from './subscription.guard';

@Module({
  controllers: [SubscriptionController],
  providers: [SubscriptionService, PremiumGuard],
  exports: [SubscriptionService, PremiumGuard],
})
export class SubscriptionModule {}
