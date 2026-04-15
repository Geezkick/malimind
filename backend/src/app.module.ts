import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { SynergyModule } from './modules/synergy/synergy.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { AiModule } from './modules/ai/ai.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { EventsModule } from './modules/events/events.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SubscriptionModule } from './modules/subscription/subscription.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate limiting: 60 requests per 60 seconds globally
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 60,
    }]),
    EventEmitterModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    TransactionsModule,
    SynergyModule,
    AiModule,
    NotificationsModule,
    WalletModule,
    EventsModule,
    SubscriptionModule,
  ],
  providers: [
    // Apply rate limiting guard globally to all routes
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
