import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MemoryService } from '../ai/memory.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private memoryService: MemoryService,
    private eventEmitter: EventEmitter2,
  ) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, phone: true, avatar: true, createdAt: true,
        wallet: { select: { balance: true, currency: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string; avatar?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, phone: true, avatar: true },
    });
  }

  async getDashboard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
        aiState: true,
        chamaMembers: {
          include: {
            chama: { select: { id: true, name: true, targetAmount: true, frequency: true } }
          }
        },
        spendingCategories: true,
        utilityBills: { where: { status: 'UNPAID' }, orderBy: { dueDate: 'asc' }, take: 5 },
        savingsGoals: { orderBy: { deadline: 'asc' }, take: 5 }
      }
    });

    const recentTx = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    let safeToSpendFactors: any = null;
    try {
      safeToSpendFactors = JSON.parse(user?.aiState?.safeToSpendFactors || 'null');
    } catch { safeToSpendFactors = null; }

    const isPremium = user?.subscription === 'PREMIUM';
    const memoryInsight = isPremium ? await this.memoryService.getMemoryInsight(userId) : null;

    return {
      isPremium,
      balance: user?.wallet?.balance || 0,
      currency: user?.wallet?.currency || 'KES',
      safeToSpend: user?.aiState?.safeToSpend || 0,
      riskScore: user?.aiState?.riskScore || 50,
      lastInsight: user?.aiState?.lastInsight || 'Initializing Mali Intelligence...',
      projectedDepletionDate: user?.aiState?.projectedDepletionDate || null,
      cashflowVelocity: user?.aiState?.cashflowVelocity || 0,
      safeToSpendFactors,
      memoryInsight,
      activeSynergies: user?.chamaMembers.map(m => ({
        ...m.chama,
        trustScore: m.trustScore,
        trustLevel: m.trustLevel,
        behavioralInsight: m.behavioralInsight,
      })) || [],
      recentTransactions: recentTx,
      spendingCockpit: {
        categories: user?.spendingCategories || [],
        upcomingUtilities: user?.utilityBills || [],
        savingsGoals: user?.savingsGoals || [],
      }
    };
  }

  async getLanguage(userId: string) {
    const settings = await this.prisma.userSettings.findUnique({ where: { userId } });
    return { language: settings?.language || 'en' };
  }

  async setLanguage(userId: string, language: string) {
    const settings = await this.prisma.userSettings.upsert({
      where: { userId },
      update: { language },
      create: { userId, language },
    });

    // Trigger AI recompute to rebuild insights in the new language
    this.eventEmitter.emit('ai.recompute', { userId });

    return settings;
  }

  async getSettingsDashboard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        settings: true,
        aiState: true,
        financialMemory: true,
        subscriptions: {
          where: { status: { in: ['ACTIVE', 'GRACE_PERIOD'] } },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        wallet: { select: { balance: true, currency: true } },
        _count: { select: { chamaMembers: true } }
      }
    });

    if (!user) throw new NotFoundException('User not found');

    const activeSub = user.subscriptions[0] || null;
    const isPremium = user.subscription === 'PREMIUM';

    // Mapping fraud status based on riskScore
    let fraudStatus = 'LOW_RISK';
    const risk = user.aiState?.riskScore || 0;
    if (risk > 80) fraudStatus = 'CRITICAL';
    else if (risk > 50) fraudStatus = 'ELEVATED';

    return {
      identity: {
        userId: user.id,
        phone: user.phone,
        walletBalance: user.wallet?.balance || 0,
        walletCurrency: user.wallet?.currency || 'KES',
        activeSynergies: user._count.chamaMembers,
      },
      subscription: {
        tier: user.subscription,
        status: activeSub?.status || 'INACTIVE',
        renewsAt: activeSub?.renewsAt || null,
        isPremium,
      },
      localization: {
        language: user.settings?.language || 'en',
      },
      aiBehavior: {
        mode: user.settings?.aiBehaviorMode || 'NORMAL',
      },
      intelligence: {
        predictiveEnabled: isPremium,
        safeToSpendV3Enabled: isPremium,
        financialMemoryEnabled: isPremium,
        fraudShieldEnabled: user.settings?.fraudShieldEnabled ?? true,
      },
      fraud: {
        status: fraudStatus,
        riskScore: risk,
      },
      memory: {
        summary: user.financialMemory ? {
          avgSpending: user.financialMemory.avgSpending,
          volatility: user.financialMemory.volatility,
          riskTrend: user.financialMemory.riskTrend,
        } : null,
      },
      permissions: {
        canAccessPredictive: isPremium,
        canAccessSafeToSpendV3: isPremium,
        canAccessAdvancedSynergy: isPremium,
        canAccessFinancialMemory: isPremium,
      }
    };
  }

  async updateSettings(userId: string, data: { language?: string; aiBehaviorMode?: any; fraudShieldEnabled?: boolean }) {
    const updated = await this.prisma.userSettings.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data as any },
    });

    if (data.language || data.aiBehaviorMode) {
      this.eventEmitter.emit('ai.recompute', { userId });
    }

    return updated;
  }

  async getProfileDashboard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
        chamaMembers: { select: { trustScore: true } },
        aiState: true,
        financialMemory: true,
        settings: true,
        subscriptions: {
          where: { status: { in: ['ACTIVE', 'GRACE_PERIOD'] } },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: { select: { chamaMembers: true } }
      }
    });

    if (!user) throw new NotFoundException('User not found');

    const activeSub = user.subscriptions[0] || null;
    const isPremium = user.subscription === 'PREMIUM';
    
    // Calculate Average Trust Score
    const totalTrust = user.chamaMembers.reduce((acc, m) => acc + m.trustScore, 0);
    const avgTrust = user.chamaMembers.length > 0 ? Math.round(totalTrust / user.chamaMembers.length) : 100;

    // AI Behavior Logic
    const mode = user.settings?.aiBehaviorMode || 'NORMAL';
    let intelligenceSummary = 'Balanced financial intelligence active.';
    if (mode === 'STRICT') intelligenceSummary = 'Risk-focused discipline for aggressive capital preservation.';
    if (mode === 'ADVISORY') intelligenceSummary = 'Neutral diagnostic insights and objective data analysis.';

    // Security calculations
    let fraudStatus = 'STABLE';
    if ((user.aiState?.riskScore || 0) > 70) fraudStatus = 'AT RISK';

    return {
      identity: {
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        walletBalance: user.wallet?.balance || 0,
        walletCurrency: user.wallet?.currency || 'KES',
        activeSynergies: user._count.chamaMembers,
        avgTrustScore: avgTrust,
        healthIndicator: (user.aiState?.riskScore || 0) < 30 ? 'ELITE' : 'STABLE'
      },
      subscription: {
        isPremium,
        tier: user.subscription,
        status: activeSub?.status || 'INACTIVE',
        renewsAt: activeSub?.renewsAt || null,
      },
      aiBehavior: {
        mode,
        intelligenceSummary,
      },
      localization: {
        language: user.settings?.language || 'en',
      },
      security: {
        fraudStatus,
        riskScore: user.aiState?.riskScore || 50,
        activeSessions: 1, // Placeholder as no session model exists yet
        trustDecay: 0.02,   // Mocked decay coefficient
      },
      memory: {
        avgSpending: user.financialMemory?.avgSpending || 0,
        consistencyScore: user.financialMemory?.consistency || 100,
        riskTrend: (user.financialMemory?.riskTrend || 'stable').toUpperCase(),
      }
    };
  }
}
