import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [HttpModule, AiModule],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
