import { Controller, Post, Body, UseGuards, Request, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MpesaService } from './mpesa.service';
import { StkPushDto } from './dto/mpesa.dto';

@ApiTags('M-Pesa')
@Controller('mpesa')
export class MpesaController {
  private readonly logger = new Logger(MpesaController.name);

  constructor(private readonly mpesaService: MpesaService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('deposit')
  @ApiOperation({ summary: 'Initiate M-Pesa STK Push for wallet deposit' })
  deposit(@Request() req, @Body() dto: StkPushDto) {
    return this.mpesaService.stkPush(req.user.id, dto);
  }

  // Public webhook endpoint for Safaricom Daraja
  @Post('callback')
  @ApiOperation({ summary: 'Safaricom Webhook Callback URL' })
  async handleCallback(@Body() payload: any) {
    this.logger.log('Safaricom webhook hit');
    await this.mpesaService.processCallback(payload);
    return { ResultCode: 0, ResultDesc: 'Accepted' }; // Safaricom expects a response
  }
}
