import { Controller, Get, Post, Body, UseGuards, Req, Logger } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('subscription')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  private readonly logger = new Logger(SubscriptionController.name);

  constructor(private readonly subscriptionService: SubscriptionService) {}

  /** Get current subscription status */
  @Get('status')
  getStatus(@Req() req: any) {
    return this.subscriptionService.getStatus(req.user.id);
  }

  /**
   * Simulate upgrade (dev/test only).
   * In production replace with STK Push initiation.
   */
  @Post('simulate-upgrade')
  simulateUpgrade(@Req() req: any) {
    return this.subscriptionService.simulateUpgrade(req.user.id);
  }

  /**
   * M-Pesa payment callback webhook.
   * Called by Safaricom after successful STK Push.
   * This endpoint is NOT protected by JWT so Safaricom can reach it.
   */
  @Post('callback')
  async mpesaCallback(@Body() body: any) {
    try {
      const result = body?.Body?.stkCallback;
      if (!result || result.ResultCode !== 0) {
        this.logger.warn('M-Pesa callback failed or duplicate', result?.ResultDesc);
        return { status: 'ignored' };
      }

      const metadata: any[] = result.CallbackMetadata?.Item ?? [];
      const get = (name: string) => metadata.find((i: any) => i.Name === name)?.Value;

      const mpesaReceiptId = get('MpesaReceiptNumber');
      const amountPaid = get('Amount');
      const phone = get('PhoneNumber');

      if (!mpesaReceiptId || !amountPaid) {
        this.logger.warn('Incomplete M-Pesa callback metadata');
        return { status: 'incomplete' };
      }

      // Look up user by phone number
      const user = await (this as any).subscriptionService['prisma'].user.findFirst({
        where: { phone: String(phone) },
      });

      if (!user) {
        this.logger.warn(`No user found for phone: ${phone}`);
        return { status: 'user_not_found' };
      }

      const result2 = await this.subscriptionService.activatePremium(
        user.id,
        mpesaReceiptId,
        Number(amountPaid),
      );

      this.logger.log(`Premium activated for user ${user.id} via ${mpesaReceiptId}`);
      return { status: 'success', ...result2 };
    } catch (err) {
      this.logger.error('M-Pesa callback processing error', err);
      return { status: 'error' };
    }
  }

  /** Admin endpoint: run the expiry sweep manually */
  @Post('run-expiry')
  runExpiry() {
    return this.subscriptionService.expireOverdueSubscriptions();
  }
}
