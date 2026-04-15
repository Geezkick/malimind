import { Controller, Post, Body, UseGuards, Request, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WalletService } from './wallet.service';
import { StkPushDto } from './dto/wallet.dto';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
  private readonly logger = new Logger(WalletController.name);

  constructor(private readonly walletService: WalletService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('deposit')
  @ApiOperation({ summary: 'Initiate M-Pesa STK Push' })
  deposit(@Request() req, @Body() dto: StkPushDto) {
    return this.walletService.stkPush(req.user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('simulate-deposit')
  @ApiOperation({ summary: 'Simulate successful wallet deposit' })
  simulateDeposit(@Request() req, @Body() dto: { amount: number }) {
    return this.walletService.simulateDeposit(req.user.id, dto.amount);
  }

  // Public webhook endpoint for Safaricom Daraja
  @Post('callback')
  @ApiOperation({ summary: 'Safaricom Webhook Callback URL' })
  async handleCallback(@Body() payload: any) {
    this.logger.log('Safaricom webhook hit');
    await this.walletService.processCallback(payload);
    return { ResultCode: 0, ResultDesc: 'Accepted' }; // Safaricom expects a response
  }
}
