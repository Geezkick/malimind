import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { GoalsModule } from './modules/goals/goals.module';
import { ChamaModule } from './modules/chama/chama.module';
import { OpportunitiesModule } from './modules/opportunities/opportunities.module';
import { AiModule } from './modules/ai/ai.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MpesaModule } from './modules/mpesa/mpesa.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    TransactionsModule,
    GoalsModule,
    ChamaModule,
    OpportunitiesModule,
    AiModule,
    NotificationsModule,
    MpesaModule,
  ],
})
export class AppModule {}
