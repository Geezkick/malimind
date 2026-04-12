import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OpportunitiesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.opportunity.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.opportunity.findUnique({
      where: { id },
    });
  }
}
