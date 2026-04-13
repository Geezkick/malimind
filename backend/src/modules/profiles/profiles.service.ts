import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSkillProfileDto, CreateRatingDto } from './dto/profiles.dto';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  async upsertProfile(userId: string, dto: UpdateSkillProfileDto) {
    return this.prisma.skillProfile.upsert({
      where: { userId },
      update: dto,
      create: {
        ...dto,
        userId,
      },
    });
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.skillProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { name: true, avatar: true, createdAt: true }
        }
      }
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async findWorkers(query: any) {
    // Basic search/list for workers
    return this.prisma.skillProfile.findMany({
      include: {
        user: {
          select: { name: true, avatar: true }
        }
      },
      orderBy: { rating: 'desc' }
    });
  }

  async addRating(reviewerId: string, dto: CreateRatingDto) {
    const rating = await this.prisma.userRating.create({
      data: {
        ...dto,
        reviewerId,
      }
    });

    // Update target user's average rating in SkillProfile
    const allRatings = await this.prisma.userRating.findMany({
      where: { targetUserId: dto.targetUserId }
    });

    const avg = allRatings.reduce((acc, curr) => acc + curr.rating, 0) / allRatings.length;

    await this.prisma.skillProfile.update({
      where: { userId: dto.targetUserId },
      data: { rating: avg }
    });

    return rating;
  }
}
