import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    const goals = await this.prisma.goal.findMany({ where: { userId } });
    const recentTx = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Safe to spend calculation
    const totalGoalRemaining = goals.reduce(
      (acc, g) => acc + (g.targetAmount - g.currentAmount), 0,
    );
    const firstDeadline = goals.length > 0 ? new Date(goals[0].deadline).getTime() : Date.now() + 30 * 86400000;
    const daysLeft = Math.max(1, Math.ceil((firstDeadline - Date.now()) / 86400000));
    const safeToSpend = Math.max(0, ((wallet?.balance || 0) - totalGoalRemaining) / daysLeft);

    return {
      balance: wallet?.balance || 0,
      currency: wallet?.currency || 'KES',
      safeToSpend: Math.round(safeToSpend),
      goals,
      recentTransactions: recentTx,
    };
  }

  async getEmployerDashboard(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    const activeJobs = await this.prisma.job.findMany({
      where: { employerId: userId, status: 'open' },
      include: { _count: { select: { applications: true } } }
    });

    return {
      balance: (wallet?.balance || 0) * 1.5, // Simulating business budget
      spent: (wallet?.balance || 0) * 0.2,
      activeJobs: activeJobs.map(j => ({
        id: j.id,
        title: j.title,
        applicants: j._count.applications,
        budget: j.budget,
        emoji: '📋'
      })),
      recentTransactions: [],
    };
  }
}
