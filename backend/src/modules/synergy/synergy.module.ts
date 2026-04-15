import { Module } from '@nestjs/common';
import { SynergyController } from './synergy.controller';
import { SynergyService } from './synergy.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [SynergyController],
  providers: [SynergyService],
})
export class SynergyModule {}
