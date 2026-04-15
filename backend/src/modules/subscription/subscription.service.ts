import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

const PREMIUM_PRICE_KES = 299;

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscription: true,
        subscriptions: {
          where: { status: { in: ['ACTIVE', 'GRACE_PERIOD'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const activeSub = user?.subscriptions[0] ?? null;

    return {
      tier: user?.subscription ?? 'FREE',
      isPremium: user?.subscription === 'PREMIUM',
      renewsAt: activeSub?.renewsAt ?? null,
      status: activeSub?.status ?? null,
      priceKes: PREMIUM_PRICE_KES,
    };
  }

  /**
   * Called after M-Pesa callback confirms payment.
   * Atomically upgrades user tier and records subscription.
   */
  async activatePremium(userId: string, mpesaReceiptId: string, amountPaid: number) {
    // Idempotency: reject duplicate receipt IDs
    const existing = await this.prisma.subscription.findUnique({
      where: { mpesaReceiptId },
    });
    if (existing) return { alreadyProcessed: true };

    const renewsAt = new Date();
    renewsAt.setDate(renewsAt.getDate() + 30); // 30-day period

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { subscription: 'PREMIUM' },
      });

      await tx.subscription.create({
        data: {
          userId,
          tier: 'PREMIUM',
          status: 'ACTIVE',
          renewsAt,
          mpesaReceiptId,
          amountPaid,
        },
      });
    });

    // Trigger AI recompute so premium intelligence kicks in immediately
    this.eventEmitter.emit('ai.recompute', { userId });

    return { activated: true, renewsAt };
  }

  /**
   * Simulates upgrade for testing (auto-generates a fake receipt).
   */
  async simulateUpgrade(userId: string) {
    const fakeReceipt = `SIM-SUB-${Date.now()}-${userId.slice(0, 6)}`;
    return this.activatePremium(userId, fakeReceipt, PREMIUM_PRICE_KES);
  }

  /**
   * Demote users whose subscriptions have expired past the grace period.
   * In production this would run as a cron job (e.g. every hour).
   */
  async expireOverdueSubscriptions() {
    const now = new Date();

    // Mark ACTIVE subs past renewsAt as GRACE_PERIOD (7-day grace)
    const graceEnd = new Date();
    graceEnd.setDate(graceEnd.getDate() + 7);

    const overdueActive = await this.prisma.subscription.findMany({
      where: { status: 'ACTIVE', renewsAt: { lt: now } },
    });

    for (const sub of overdueActive) {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: 'GRACE_PERIOD',
          gracePeriodEndsAt: graceEnd,
        },
      });
    }

    // Fully expire GRACE_PERIOD subs past grace end
    const graceExpired = await this.prisma.subscription.findMany({
      where: { status: 'GRACE_PERIOD', gracePeriodEndsAt: { lt: now } },
    });

    for (const sub of graceExpired) {
      await this.prisma.$transaction(async (tx) => {
        await tx.subscription.update({
          where: { id: sub.id },
          data: { status: 'EXPIRED' },
        });
        await tx.user.update({
          where: { id: sub.userId },
          data: { subscription: 'FREE' },
        });
      });
    }

    return {
      movedToGrace: overdueActive.length,
      expired: graceExpired.length,
    };
  }
}
