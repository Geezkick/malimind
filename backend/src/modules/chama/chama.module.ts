import { Module } from '@nestjs/common';
import { ChamaController } from './chama.controller';
import { ChamaService } from './chama.service';

@Module({
  controllers: [ChamaController],
  providers: [ChamaService],
})
export class ChamaModule {}
