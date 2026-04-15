import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import OpenAI from 'openai';
import { ChatPromptDto } from './dto/ai.dto';
import { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources';
import { EventsGateway } from '../events/events.gateway';
import { OnEvent } from '@nestjs/event-emitter';
import { MemoryService } from './memory.service';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private memoryService: MemoryService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy_key_for_now',
    });
  }

  async chat(userId: string, dto: ChatPromptDto) {
    // 1. Fetch deep context
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
        chamaMembers: { include: { chama: true } },
        settings: true,
      }
    });

    const recentTx = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const healthScore = this.calculateHealthScore(user, recentTx);
    const balance = user?.wallet?.balance || 0;

    // 2. Fetch History
    const history = await this.prisma.aIMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    const messages: ChatCompletionMessageParam[] = history.reverse().map(m => ({
      role: m.role as any,
      content: m.content,
    }));

    const systemPrompt = `You are the MaliWealth Architect, a sophisticated financial intelligence layer for users in Kenya. 
Your goal is to help users build generational wealth through smart budgeting, goal tracking, and opportunity matching.

CONTEXT:
- User Health Score: ${healthScore}/100
- Balance: KES ${balance}

CAPABILITIES:
- You can LOG transactions (income/expense).

TONE: Professional, firm on discipline, encouraging on growth. Use Kenyan context (KES, Chamas).
LANGUAGE CONSTRAINT: ${user.settings?.language === 'sw' ? 'Respond EXCLUSIVELY in fluent Swahili (Kiswahili).' : 'Respond EXCLUSIVELY in English.'}`;

    messages.unshift({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: dto.prompt });

    // 3. Define Tools
    const tools: ChatCompletionTool[] = [
      {
        type: 'function',
        function: {
          name: 'record_transaction',
          description: 'Logs a new income or expense transaction for the user.',
          parameters: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['income', 'expense'] },
              amount: { type: 'number' },
              category: { type: 'string', description: 'e.g. Food, Transport, Rent, Salary' },
              note: { type: 'string' }
            },
            required: ['type', 'amount', 'category']
          }
        }
      }
    ];

    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey || apiKey === 'sk-dummy-key') {
        return this.handleMockResponse(userId, dto.prompt, balance, user);
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        tools,
        tool_choice: 'auto',
      });

      const message = response.choices[0].message;
      
      // Save user message
      await this.prisma.aIMessage.create({
        data: { userId, role: 'user', content: dto.prompt }
      });

      if (message.tool_calls) {
        for (const toolCall of message.tool_calls) {
          const result = await this.handleToolCall(userId, toolCall);
          messages.push(message);
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result)
          });
        }

        // Get final response after tool execution
        const finalResponse = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          messages
        });

        const reply = finalResponse.choices[0].message.content || 'Action completed.';
        await this.prisma.aIMessage.create({
          data: { userId, role: 'assistant', content: reply }
        });
        return { reply };
      }

      const reply = message.content || 'I could not process that.';
      await this.prisma.aIMessage.create({
        data: { userId, role: 'assistant', content: reply }
      });

      return { reply };

    } catch (error) {
      console.error('AI Error:', error);
      throw new InternalServerErrorException('Intelligence Layer restricted.');
    }
  }

  private async handleToolCall(userId: string, toolCall: any) {
    const args = JSON.parse(toolCall.function.arguments);
    
    if (toolCall.function.name === 'record_transaction') {
      const tx = await this.prisma.transaction.create({
        data: {
          userId,
          type: args.type,
          amount: args.amount,
          category: args.category,
          note: args.note
        }
      });
      // Update wallet balance
      const multiplier = args.type === 'income' ? 1 : -1;
      await this.prisma.wallet.update({
        where: { userId },
        data: { balance: { increment: args.amount * multiplier } }
      });

      // UPDATE SPENDING CATEGORY IF EXPENSE
      if (args.type === 'expense') {
        const cat = await this.prisma.spendingCategory.findFirst({
          where: { userId, name: { contains: args.category, mode: 'insensitive' } }
        });
        if (cat) {
          await this.prisma.spendingCategory.update({
            where: { id: cat.id },
            data: { spent: { increment: args.amount } }
          });
        }
      }

      return { status: 'success', transactionId: tx.id };
    }
  }

  private async handleMockResponse(userId: string, prompt: string, balance: number, user: any) {
    const reply = `[PRO MOCK] I analyzed your request: "${prompt}". Your current balance is KES ${balance}. Since no OpenAI key is configured, I am simulating elite intelligence. Try logging a transaction like "Spend 500 on lunch".`;
    
    // Check for simulated actions in mock
    if (prompt.toLowerCase().includes('spend') || prompt.toLowerCase().includes('income')) {
       // Mock auto-logging for demo purposes even without AI
    }

    await this.prisma.aIMessage.create({
      data: { userId, role: 'user', content: prompt }
    });
    await this.prisma.aIMessage.create({
      data: { userId, role: 'assistant', content: reply }
    });

    return { reply };
  }

  private calculateHealthScore(user: any, transactions: any[]): number {
    let score = 50;
    if (user?.wallet?.balance > 10000) score += 10;
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    if (income > expense) score += 10;
    return Math.min(score, 100);
  }

  @OnEvent('ai.recompute')
  async handleRecomputeEvent(payload: { userId: string }) {
    try {
      await this.recomputeIntelligence(payload.userId);
    } catch (error) {
      console.error('Failed to run AI intelligence pipeline:', error);
    }
  }


  async recomputeIntelligence(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
        chamaMembers: { include: { chama: true } },
        financialMemory: true,
        settings: true,
        spendingCategories: true,
        utilityBills: { where: { status: 'UNPAID' } },
        savingsGoals: true,
      },
    });

    if (!user || !user.wallet) return null;
    const isPremium = user.subscription === 'PREMIUM';

    const balance = user.wallet.balance;
    let obligatedCapital = 0;
    user.chamaMembers.forEach(mem => {
      obligatedCapital += mem.chama.targetAmount || 0;
    });

    // ── 1. Fetch 30-day expense data ──────────────────────────────────────────
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const expenses = await this.prisma.transaction.findMany({
      where: { userId, type: 'expense', createdAt: { gte: thirtyDaysAgo } },
    });
    const volatility = this.memoryService.computeVolatility(expenses.map(e => e.amount));

    const lang = user.settings?.language === 'sw' ? 'sw' : 'en';

    // FREE TIER LOGIC (Short-circuits the heavy engine)
    if (!isPremium) {
      const basicRisk = balance < 1000 ? 80 : balance < 5000 ? 50 : 20;
      const basicSafe = Math.round(balance * 0.7);
      
      const insightEn = "Upgrade to Mali Pro for deep predictive cashflow & behavioral insights.";
      const insightSw = "Jiunge na Mali Pro kwa uchambuzi wa kina na makadirio ya pesa.";
      const insight = lang === 'sw' ? insightSw : insightEn;

      const savedState = await this.prisma.aIState.upsert({
        where: { userId },
        update: { 
          safeToSpend: basicSafe, 
          riskScore: basicRisk, 
          lastInsight: insight,
          projectedDepletionDate: null,
          cashflowVelocity: null,
          safeToSpendFactors: null,
          lastComputedAt: new Date() 
        },
        create: { 
          userId, 
          safeToSpend: basicSafe, 
          riskScore: basicRisk, 
          lastInsight: insight 
        },
      });

      this.eventsGateway.pushDashboardUpdate(userId, {
        balance, safeToSpend: basicSafe, riskScore: basicRisk, insight,
      });

      return savedState;
    }

    // --- PREMIUM TIER LOGIC (Phase 6 / v3 Enhancements) ---
    
    // ── 2. Predictive Cashflow ─────────────────────────────────────────────────
    let cashflowVelocity = 0;
    let projectedDepletionDate: Date | null = null;
    if (expenses.length > 0) {
      const totalSpend30 = expenses.reduce((a, b) => a + b.amount, 0);
      cashflowVelocity = totalSpend30 / 30;
      if (cashflowVelocity > 0) {
        const dailyNetBurn = cashflowVelocity + obligatedCapital / 30;
        const days = balance / dailyNetBurn;
        if (days < 365) {
          projectedDepletionDate = new Date();
          projectedDepletionDate.setDate(projectedDepletionDate.getDate() + Math.floor(days));
        }
      }
    }

    // ── 3. Chama Trust Score Engine ────────────────────────────────────────────
    let totalConsistency = 0;
    for (const mem of user.chamaMembers) {
      const chama = mem.chama;
      const daysInChama = Math.max(1,
        (Date.now() - mem.joinedAt.getTime()) / (1000 * 60 * 60 * 24));
      const freqDays = chama.frequency === 'weekly' ? 7 : 30;
      const expectedCycles = Math.max(1, Math.floor(daysInChama / freqDays));
      const expectedAmount = expectedCycles * (chama.targetAmount || 0);
      const contributions = await this.prisma.contribution.findMany({
        where: { userId, chamaId: chama.id },
      });
      const contributed = contributions.reduce((a, b) => a + b.amount, 0);

      let trustScore = 100;
      let trustLevel = 'High';
      let behavioralInsight = lang === 'sw' ? 'Muendelezo mzuri wa michango.' : 'Consistent pattern detected.';
      if (expectedAmount > 0) {
        const ratio = contributed / expectedAmount;
        if (ratio < 1) trustScore = Math.max(0, Math.round(100 - (1 - ratio) * 100));
        else {
          if (expectedCycles > 3) trustScore = Math.min(100, trustScore + 5);
          if (expectedCycles > 12) trustScore = Math.min(100, trustScore + 10);
        }
      }
      if (trustScore < 50) { 
        trustLevel = 'Low'; 
        behavioralInsight = lang === 'sw' ? 'Hatari ya madeni: Michango haiendani.' : 'Critical delinquency risk detected. Urgent capital catch-up required.'; 
      }
      else if (trustScore < 80) { 
        trustLevel = 'Medium'; 
        behavioralInsight = lang === 'sw' ? 'Michango hairidhishi. Kuepuka faini, weka zaidi.' : 'Inconsistent contribution flow. Reliability slipping.'; 
      }
      else if (trustScore === 100) { 
        behavioralInsight = lang === 'sw' ? 'Uaminifu bora kwa kikundi.' : 'Impeccable alignment with group capital expectations.'; 
      }

      totalConsistency += trustScore;
      await this.prisma.chamaMember.update({
        where: { id: mem.id },
        data: { trustScore, trustLevel, behavioralInsight },
      });
    }
    const avgTrustScore = user.chamaMembers.length > 0
      ? totalConsistency / user.chamaMembers.length
      : 100;

    // ── 4. Risk Score v2 formula ───────────────────────────────────────────────
    const obligationPressure = balance > 0
      ? Math.min(100, (obligatedCapital / balance) * 100)
      : obligatedCapital > 0 ? 100 : 0;
    const lowBalancePressure = balance < 1000 ? 100 : Math.max(0, 100 - balance / 1000);
    const riskScore = Math.round(
      obligationPressure * 0.5 + volatility * 0.3 + lowBalancePressure * 0.2
    );

    // ── 5. Real-life Obligations (v4) ──────────────────────────────────────────
    
    // Upcoming bills in next 14 days
    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + 14);
    const upcomingBills = user.utilityBills.filter(b => b.dueDate <= upcomingDate);
    const upcomingBillsTotal = upcomingBills.reduce((acc, b) => acc + b.amount, 0);

    // Monthly savings contribution slice
    let savingsMonthlyBuffer = 0;
    user.savingsGoals.forEach(goal => {
      const remaining = goal.targetAmount - goal.currentAmount;
      if (remaining > 0) {
        const daysLeft = Math.max(1, (goal.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const dailyReq = remaining / daysLeft;
        savingsMonthlyBuffer += dailyReq * 30; // One month slice
      }
    });

    // Category Pressure
    let categoryPressureAdjustment = 1.0;
    let pressureReason = lang === 'sw' ? 'Hakuna shinikizo la matumizi.' : 'No budget pressure detected.';
    const overLimitCategories = user.spendingCategories.filter(c => c.spent >= c.limit);
    if (overLimitCategories.length > 0) {
      categoryPressureAdjustment = 0.85; // 15% haircut if over budget in any category
      pressureReason = lang === 'sw' 
        ? `Shinikizo la bajeti (${overLimitCategories.length} kategoria zimezidi).` 
        : `Budget pressure (${overLimitCategories.length} categories over limit).`;
    }

    // ── 5. Safe-to-Spend v4 (Predictive + Trust-Weighted + Obligations) ───────
    const emergencyBuffer = balance * 0.15;

    // Trust adjustment factor
    let trustFactor = 1.0;
    let trustReason = lang === 'sw' ? 'Uaminifu wa kati.' : 'Neutral trust (50–80 range).';
    if (avgTrustScore > 80) { 
      trustFactor = 1.1; 
      trustReason = lang === 'sw' ? `Uaminifu juu (${avgTrustScore.toFixed(0)}) — nyongeza 10%.` : `High trust score (${avgTrustScore.toFixed(0)}) — +10% spending allowance.`; 
    } else if (avgTrustScore < 50) { 
      trustFactor = 0.85; 
      trustReason = lang === 'sw' ? `Uaminifu chini (${avgTrustScore.toFixed(0)}) — makato 15%.` : `Low trust score (${avgTrustScore.toFixed(0)}) — 15% spending reduction applied.`; 
    }

    // Behavior risk factor based on volatility
    let behaviorFactor = 1.0;
    let behaviorReason = lang === 'sw' ? 'Matumizi tulivu.' : 'Low volatility — full spending allowance.';
    if (volatility > 60) { 
      behaviorFactor = 0.8; 
      behaviorReason = lang === 'sw' ? `Matumizi yasiyotabirika — makato 20%.` : `High spending volatility (${volatility.toFixed(1)}) — 20% reduction.`; 
    } else if (volatility > 30) { 
      behaviorFactor = 0.9; 
      behaviorReason = lang === 'sw' ? `Matumizi yanayobadilika — makato 10%.` : `Medium spending volatility (${volatility.toFixed(1)}) — 10% reduction.`; 
    }
    
    const walletReality = Math.max(0, balance - obligatedCapital - upcomingBillsTotal - (savingsMonthlyBuffer / 4) - emergencyBuffer);
    const safeToSpend = Math.max(0, walletReality * trustFactor * behaviorFactor * categoryPressureAdjustment);

    // Factors breakdown for UI explainability
    const safeToSpendFactors = JSON.stringify({
      walletReality: Math.round(walletReality),
      emergencyBuffer: Math.round(emergencyBuffer),
      futureObligations: Math.round(obligatedCapital),
      upcomingBillsTotal: Math.round(upcomingBillsTotal),
      savingsMonthlyBuffer: Math.round(savingsMonthlyBuffer),
      trustFactor,
      trustReason,
      behaviorFactor,
      behaviorReason,
      categoryPressureAdjustment,
      pressureReason,
      avgTrustScore: Math.round(avgTrustScore),
      volatility: Math.round(volatility),
    });

    // ── 6. Adaptive insight (memory-aware) ────────────────────────────────────
    const memoryInsight = await this.memoryService.getMemoryInsight(userId);
    let insight: string;
    
    if (overLimitCategories.length > 0) {
       insight = lang === 'sw' 
         ? `Tahadhari: Umevuka bajeti ya ${overLimitCategories[0].name}. Punguza matumizi.`
         : `Warning: You are over budget in ${overLimitCategories[0].name}. Immediate correction advised.`;
    } else if (upcomingBillsTotal > balance * 0.5) {
       insight = lang === 'sw'
         ? `ONYO: Gharama za huduma hivi karibuni (KES ${upcomingBillsTotal}) ni kubwa mno.`
         : `URGENT: Upcoming utilities (KES ${upcomingBillsTotal}) consume over 50% of your liquidity.`;
    } else if (riskScore > 75) {
      if (obligationPressure > 80) insight = lang === 'sw' ? 'HATARI: Madeni yanazidi uwezo. Punguza matumizi yasiyo ya lazima.' : 'CRITICAL RISK: Synergy obligations massively outweigh liquid capital. Halt non-essential spending.';
      else if (volatility > 70) insight = lang === 'sw' ? 'HATARI: Usafiri usiotabirika wa pesa. Rekebisha mfumo wako.' : 'HIGH RISK: Severe spending volatility detected over trailing 30 days. Normalize cashflow.';
      else insight = lang === 'sw' ? 'HATARI: Pesa yako iko chini sana.' : 'HIGH RISK: Capital levels are dangerously low.';
    } else if (riskScore > 40) {
      insight = projectedDepletionDate
        ? (lang === 'sw' ? `Hali ya kati. Pesa inaweza kuisha tarehe ${projectedDepletionDate.toDateString()}.` : `Moderate conditions. Depletion trajectory: ${projectedDepletionDate.toDateString()}.`)
        : (lang === 'sw' ? 'Hali thabiti kiasi. Chunga matumizi.' : 'Moderate conditions. Risk vectors exist — monitor discretionary spend.');
    } else {
      // Memory insight is theoretically translated but we'll return english core for now
      insight = lang === 'sw' ? 'Nzuri sana, pesa imetulia. Hifadhi.' : memoryInsight;
    }

    // ── 7. Persist memory and broadcast ───────────────────────────────────────
    await this.memoryService.appendRiskScore(userId, riskScore);

    const savedState = await this.prisma.aIState.upsert({
      where: { userId },
      update: { safeToSpend, riskScore, lastInsight: insight, projectedDepletionDate, cashflowVelocity, safeToSpendFactors, lastComputedAt: new Date() },
      create: { userId, safeToSpend, riskScore, lastInsight: insight, projectedDepletionDate, cashflowVelocity, safeToSpendFactors },
    });

    this.eventsGateway.pushDashboardUpdate(userId, {
      balance, safeToSpend, riskScore, insight,
      projectedDepletionDate, cashflowVelocity, safeToSpendFactors,
    });

    return savedState;
  }
}

