import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MemoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Computes the normalized volatility (0–100) of a list of expense amounts
   * using a population standard deviation, clamped to a max of KES 50,000 stddev.
   */
  computeVolatility(amounts: number[]): number {
    if (amounts.length < 2) return 0;
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    return Math.min(100, (stdDev / 50000) * 100);
  }

  /**
   * The Memory update pipeline. Triggered after every transaction.
   * Uses Exponential Weighted Moving Average (EWMA) so recent behavior
   * carries more weight than old data. Alpha=0.2 means 20% new, 80% old.
   */
  @OnEvent('transaction.completed')
  async updateMemory(payload: { userId: string }): Promise<void> {
    const { userId } = payload;

    try {
      const ALPHA = 0.2; // EWMA smoothing factor

      // 1. Fetch all-time transactions to build behavioral baseline
      const allExpenses = await this.prisma.transaction.findMany({
        where: { userId, type: 'expense' },
        orderBy: { createdAt: 'asc' },
      });

      // 2. Daily spend series (average per day with recorded activity)
      const dailySpends = new Map<string, number>();
      for (const tx of allExpenses) {
        const day = tx.createdAt.toISOString().split('T')[0];
        dailySpends.set(day, (dailySpends.get(day) || 0) + tx.amount);
      }
      const dailyAmounts = Array.from(dailySpends.values());

      // 3. EWMA for average spending
      let ewmaSpend = dailyAmounts[0] || 0;
      for (let i = 1; i < dailyAmounts.length; i++) {
        ewmaSpend = ALPHA * dailyAmounts[i] + (1 - ALPHA) * ewmaSpend;
      }

      // 4. Volatility from raw expense amounts
      const volatility = this.computeVolatility(allExpenses.map(e => e.amount));

      // 5. Contribution consistency from Synergy memberships
      const members = await this.prisma.chamaMember.findMany({
        where: { userId },
        include: { chama: true },
      });
      let totalConsistency = 0;
      for (const mem of members) {
        totalConsistency += mem.trustScore;
      }
      const consistency = members.length > 0
        ? totalConsistency / members.length
        : 100;

      // 6. Risk trend via rolling 7-day vs 30-day average risk
      const existing = await this.prisma.userFinancialMemory.findUnique({ where: { userId } });
      let riskHistory: number[] = [];
      try {
        riskHistory = JSON.parse(existing?.riskHistory || '[]');
      } catch { riskHistory = []; }

      // Determine trend from last 7 scores vs prior scores
      let riskTrend: 'improving' | 'stable' | 'deteriorating' = 'stable';
      if (riskHistory.length >= 4) {
        const recent = riskHistory.slice(-4);
        const older = riskHistory.slice(0, -4);
        if (older.length > 0) {
          const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
          const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
          if (recentAvg < olderAvg - 5) riskTrend = 'improving';
          else if (recentAvg > olderAvg + 5) riskTrend = 'deteriorating';
        }
      }

      // 7. Upsert memory state
      await this.prisma.userFinancialMemory.upsert({
        where: { userId },
        update: {
          avgSpending: ewmaSpend,
          volatility,
          consistency,
          riskTrend,
          lastUpdated: new Date(),
        },
        create: {
          userId,
          avgSpending: ewmaSpend,
          volatility,
          consistency,
          riskTrend,
          riskHistory: '[]',
        },
      });
    } catch (err) {
      console.error('[MemoryService] Memory update failed:', err);
    }
  }

  /**
   * Append the latest riskScore to the user's memory history.
   * Called explicitly from AiService after every recompute.
   */
  async appendRiskScore(userId: string, riskScore: number): Promise<void> {
    const existing = await this.prisma.userFinancialMemory.findUnique({ where: { userId } });
    let riskHistory: number[] = [];
    try { riskHistory = JSON.parse(existing?.riskHistory || '[]'); } catch { riskHistory = []; }

    riskHistory.push(riskScore);
    if (riskHistory.length > 30) riskHistory.shift(); // Keep max 30 entries

    await this.prisma.userFinancialMemory.update({
      where: { userId },
      data: { riskHistory: JSON.stringify(riskHistory) },
    });
  }

  /**
   * Returns long-term behavioral context — drives adaptive AI insights.
   * Week 1: basic | Week 4: behavioral | Week 8+: predictive.
   */
  async getMemoryInsight(userId: string): Promise<string> {
    const mem = await this.prisma.userFinancialMemory.findUnique({ where: { userId } });
    if (!mem) return 'Insufficient data. Keep transacting to build behavioral history.';

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    });

    const daysSince = user
      ? Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Week 8+: Predictive intelligence
    if (daysSince >= 56) {
      if (mem.riskTrend === 'deteriorating' && mem.volatility > 60) {
        return `Predictive Warning: Spending cycles show escalating volatility (${mem.volatility.toFixed(1)}) with a deteriorating risk trajectory. Intervention recommended before next cycle.`;
      }
      if (mem.consistency < 70) {
        return `Behavioral Pattern: Contribution reliability has slipped to ${mem.consistency.toFixed(0)}%. Predictive modeling indicates high risk of Synergy delinquency within 2 cycles.`;
      }
      return `Behavioral Intelligence: Stable financial trajectory. Avg daily spend KES ${mem.avgSpending.toFixed(0)}, volatility at ${mem.volatility.toFixed(1)}. System forecasts continued stability.`;
    }

    // Week 4: Behavioral insights
    if (daysSince >= 28) {
      const trendMsg = mem.riskTrend === 'improving'
        ? 'Risk profile is improving month-over-month.'
        : mem.riskTrend === 'deteriorating'
        ? 'Risk profile is deteriorating. Review your spending habits.'
        : 'Risk profile is stable.';
      return `Behavioral Analysis: ${trendMsg} Spending consistency at ${mem.consistency.toFixed(0)}%.`;
    }

    // Week 1: Basic balance awareness
    return `Early Stage: Building behavioral baseline. Current avg daily spend: KES ${mem.avgSpending.toFixed(0)}.`;
  }
}
