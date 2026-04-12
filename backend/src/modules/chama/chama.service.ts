import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateChamaDto, JoinChamaDto, ContributeDto } from './dto/chama.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ChamaService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateChamaDto) {
    const inviteCode = uuidv4().substring(0, 8).toUpperCase();
    
    return this.prisma.$transaction(async (tx) => {
      const chama = await tx.chama.create({
        data: {
          ...dto,
          ownerId: userId,
          inviteCode,
        },
      });

      await tx.chamaMember.create({
        data: {
          userId,
          chamaId: chama.id,
        },
      });

      return chama;
    });
  }

  async join(userId: string, dto: JoinChamaDto) {
    const chama = await this.prisma.chama.findUnique({
      where: { inviteCode: dto.inviteCode },
    });

    if (!chama) throw new NotFoundException('Invalid invite code');

    const existingMember = await this.prisma.chamaMember.findUnique({
      where: {
        userId_chamaId: { userId, chamaId: chama.id },
      },
    });

    if (existingMember) throw new BadRequestException('Already a member of this chama');

    return this.prisma.chamaMember.create({
      data: {
        userId,
        chamaId: chama.id,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.chama.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        _count: {
          select: { members: true },
        },
        contributions: {
          select: { amount: true },
        },
      },
    });
  }

  async getDetails(userId: string, chamaId: string) {
    const chama = await this.prisma.chama.findFirst({
      where: {
        id: chamaId,
        members: { some: { userId } },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        contributions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!chama) throw new NotFoundException('Chama not found');

    const totalContributions = chama.contributions.reduce((acc, curr) => acc + curr.amount, 0);

    return {
      ...chama,
      totalBalance: totalContributions,
    };
  }

  async contribute(userId: string, chamaId: string, dto: ContributeDto) {
    const member = await this.prisma.chamaMember.findUnique({
      where: { userId_chamaId: { userId, chamaId } },
    });

    if (!member) throw new BadRequestException('Not a member of this chama');

    return this.prisma.$transaction(async (tx) => {
      // Deduct from wallet
      await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: dto.amount } },
      });

      return tx.contribution.create({
        data: {
          userId,
          chamaId,
          amount: dto.amount,
          note: dto.note,
        },
      });
    });
  }
}
