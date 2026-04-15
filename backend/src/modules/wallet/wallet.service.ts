import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { StkPushDto } from './dto/wallet.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  
  private readonly shortcode = '174379';
  private readonly passkey = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
  private readonly env = process.env.MPESA_ENVIRONMENT || 'sandbox';

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private getAuthUrl(): string {
    return this.env === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
      : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
  }

  private getStkPushUrl(): string {
    return this.env === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
  }

  async getAccessToken(): Promise<string> {
    const key = process.env.MPESA_CONSUMER_KEY;
    const secret = process.env.MPESA_CONSUMER_SECRET;
    
    if (!key || !secret) {
        throw new InternalServerErrorException('M-Pesa credentials are not configured');
    }

    const auth = Buffer.from(`${key}:${secret}`).toString('base64');
    
    try {
      const response = await lastValueFrom(
        this.httpService.get(this.getAuthUrl(), { headers: { Authorization: `Basic ${auth}` } }),
      );
      return response.data.access_token;
    } catch (error) {
      this.logger.error('Failed to generate M-Pesa token', error.response?.data || error.message);
      throw new InternalServerErrorException('Failed to authenticate with M-Pesa');
    }
  }

  async stkPush(userId: string, dto: StkPushDto) {
    const token = await this.getAccessToken();
    
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');
    const callbackUrl = process.env.MPESA_CALLBACK_URL || 'https://mydomain.com/api/v1/mpesa/callback';

    const payload = {
      BusinessShortCode: this.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: dto.amount,
      PartyA: dto.phone,
      PartyB: this.shortcode,
      PhoneNumber: dto.phone,
      CallBackURL: callbackUrl,
      AccountReference: `MaliMind_${userId}`,
      TransactionDesc: 'Wallet Deposit',
    };

    try {
      const response = await lastValueFrom(
        this.httpService.post(this.getStkPushUrl(), payload, { headers: { Authorization: `Bearer ${token}` } })
      );

      return {
        message: 'STK Push initiated successfully.',
        checkoutRequestId: response.data.CheckoutRequestID,
      };
    } catch (error) {
      this.logger.error('STK Push failed', error.response?.data || error.message);
      throw new InternalServerErrorException('Failed to trigger M-Pesa payment');
    }
  }

  async processCallback(payload: any) {
    this.logger.log('Received M-Pesa Callback');
    const callbackData = payload.Body.stkCallback;

    if (callbackData.ResultCode !== 0) {
      this.logger.warn(`Transaction failed: ${callbackData.ResultDesc}`);
      return { status: 'Received failure callback' };
    }

    const items = callbackData.CallbackMetadata.Item;
    const amountItem = items.find((item: any) => item.Name === 'Amount');
    // const receiptItem = items.find((item: any) => item.Name === 'MpesaReceiptNumber');
    
    const amount = amountItem?.Value;
    if (!amount) return;

    // Ideally look up CheckoutRequestID to find User. 
    this.logger.log(`Payment of KES ${amount} successful!`);
    return { status: 'Processed' };
  }

  async simulateDeposit(userId: string, amount: number) {
    const fakeReceipt = `SIM-${uuidv4()}`;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Idempotency Check (Guard against double-logging)
      const existing = await tx.transaction.findUnique({ where: { referenceId: fakeReceipt }});
      if (existing) return existing;

      const transaction = await tx.transaction.create({
        data: { userId, type: 'income', amount, category: 'Deposit', note: 'Simulated STK Push', referenceId: fakeReceipt }
      });

      await tx.wallet.update({
        where: { userId },
        data: { balance: { increment: amount } }
      });

      return transaction;
    });

    // 2. Decouple Events — order: transaction → memory → AI
    this.eventEmitter.emit('transaction.completed', { userId });
    this.eventEmitter.emit('ai.recompute', { userId });
    return result;
  }
}
