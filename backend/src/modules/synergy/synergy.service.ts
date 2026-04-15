import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateChamaDto, JoinChamaDto, ContributeDto } from './dto/synergy.dto';
import { v4 as uuidv4 } from 'uuid';
import { AiService } from '../ai/ai.service';
import { EventsGateway } from '../events/events.gateway';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class SynergyService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private eventsGateway: EventsGateway,
    private eventEmitter: EventEmitter2
  ) {}

  async create(userId: string, dto: CreateChamaDto) {
    const inviteCode = uuidv4().substring(0, 8).toUpperCase();
    
    const result = await this.prisma.$transaction(async (tx) => {
      const chama = await tx.chama.create({
        data: {
          ...dto,
          ownerId: userId,
          inviteCode,
          wallet: { create: { balance: 0 } }
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

    // Decoupled emit
    this.eventEmitter.emit('ai.recompute', { userId });
    return result;
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

    if (existingMember) throw new BadRequestException('Already a member of this synergy');

    const member = await this.prisma.chamaMember.create({
      data: {
        userId,
        chamaId: chama.id,
      },
    });

    this.eventEmitter.emit('ai.recompute', { userId });
    this.eventsGateway.pushChamaUpdate(chama.id, { event: 'MEMBER_JOINED', userId });

    return member;
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
        wallet: true,
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
        wallet: true,
        contributions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!chama) throw new NotFoundException('Synergy not found');

    return {
      ...chama,
      totalBalance: chama.wallet?.balance || 0,
    };
  }

  async contribute(userId: string, chamaId: string, dto: ContributeDto) {
    const member = await this.prisma.chamaMember.findUnique({
      where: { userId_chamaId: { userId, chamaId } },
    });

    if (!member) throw new BadRequestException('Not a member of this synergy');

    const contribution = await this.prisma.$transaction(async (tx) => {
      // 1. Guard against negative balance
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet || wallet.balance < dto.amount) {
         throw new BadRequestException('Negative balance operation blocked: Insufficient funds');
      }

      // Deduct from wallet safely
      await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: dto.amount } },
      });

      // Add to chama wallet
      await tx.chamaWallet.update({
        where: { chamaId },
        data: { balance: { increment: dto.amount } }
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

    this.eventEmitter.emit('ai.recompute', { userId: userId });
    this.eventsGateway.pushChamaUpdate(chamaId, { event: 'CONTRIBUTION_ADDED', amount: dto.amount, userId });

    return contribution;
  }
}
