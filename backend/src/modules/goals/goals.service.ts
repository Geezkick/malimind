import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGoalDto, UpdateGoalDto } from './dto/goal.dto';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateGoalDto) {
    return this.prisma.goal.create({
      data: { userId, ...dto, deadline: new Date(dto.deadline) },
    });
  }

  async findAll(userId: string) {
    const goals = await this.prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return goals.map(g => ({
      ...g,
      progress: Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)),
      remaining: Math.max(0, g.targetAmount - g.currentAmount),
      daysLeft: Math.max(0, Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000)),
    }));
  }

  async contribute(userId: string, goalId: string, dto: UpdateGoalDto) {
    const goal = await this.prisma.goal.findFirst({ where: { id: goalId, userId } });
    if (!goal) throw new NotFoundException('Goal not found');

    const updated = await this.prisma.goal.update({
      where: { id: goalId },
      data: { currentAmount: { increment: dto.amount } },
    });

    // Deduct from wallet
    await this.prisma.wallet.update({
      where: { userId },
      data: { balance: { decrement: dto.amount } },
    });

    return {
      ...updated,
      progress: Math.min(100, Math.round((updated.currentAmount / updated.targetAmount) * 100)),
    };
  }

  async delete(userId: string, goalId: string) {
    await this.prisma.goal.deleteMany({ where: { id: goalId, userId } });
    return { message: 'Goal deleted' };
  }

  // Safe to Spend calculation
  safeToSpend(balance: number, goals: any[]) {
    const totalRemaining = goals.reduce(
      (acc, g) => acc + Math.max(0, g.targetAmount - g.currentAmount), 0
    );
    const shortestDeadline = goals.reduce((min, g) => {
      const days = Math.max(1, Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000));
      return days < min ? days : min;
    }, 30);

    const daily = Math.max(0, (balance - totalRemaining) / shortestDeadline);
    return {
      dailyBudget: Math.round(daily),
      warning: daily < 100,
      message: daily < 100
        ? '⚠️ Spending low! Focus on your savings goals.'
        : `✅ You can safely spend KES ${Math.round(daily)} today.`,
    };
  }
}
