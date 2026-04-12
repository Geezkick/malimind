import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransactionDto } from './dto/transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateTransactionDto) {
    const tx = await this.prisma.transaction.create({
      data: { userId, ...dto },
    });

    // Update wallet balance
    const delta = dto.type === 'income' ? dto.amount : -dto.amount;
    await this.prisma.wallet.upsert({
      where: { userId },
      update: { balance: { increment: delta } },
      create: { userId, balance: delta },
    });

    return tx;
  }

  async findAll(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where: { userId } }),
    ]);

    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);

    return { transactions, total, income, expense, page, limit };
  }

  async getSummary(userId: string) {
    const all = await this.prisma.transaction.findMany({ where: { userId } });
    const byCategory = all.reduce((acc, t) => {
      if (!acc[t.category]) acc[t.category] = 0;
      acc[t.category] += t.amount;
      return acc;
    }, {} as Record<string, number>);

    return { byCategory };
  }
}
