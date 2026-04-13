import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateJobDto, NearbyJobsQueryDto } from './dto/jobs.dto';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateJobDto) {
    return this.prisma.job.create({
      data: {
        ...dto,
        employerId: userId,
      },
      include: {
        employer: {
          select: { name: true, avatar: true }
        }
      }
    });
  }

  async findAll() {
    return this.prisma.job.findMany({
      where: { status: 'open' },
      include: {
        employer: {
          select: { name: true, avatar: true }
        },
        _count: {
          select: { applications: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        employer: {
          select: { name: true, avatar: true, email: true, phone: true }
        },
        applications: {
          include: {
            user: {
              select: { name: true, avatar: true, skillProfile: true }
            }
          }
        }
      }
    });

    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async apply(userId: string, jobId: string) {
    // Check if profile exists
    const profile = await this.prisma.skillProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      throw new BadRequestException('Please set up your skill profile before applying.');
    }

    // Check if already applied
    const existing = await this.prisma.application.findFirst({
      where: { jobId, userId }
    });

    if (existing) {
       throw new BadRequestException('You have already applied for this job.');
    }

    return this.prisma.application.create({
      data: {
        jobId,
        userId,
      }
    });
  }

  async getMyApplications(userId: string) {
    return this.prisma.application.findMany({
      where: { userId },
      include: {
        job: {
          include: {
            employer: {
              select: { name: true, avatar: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findNearby(query: NearbyJobsQueryDto) {
    const { lat, lng, radius = 50 } = query;
    
    if (!lat || !lng) {
      return this.findAll();
    }

    // Since Prisma doesn't support PostGIS natively in standard findMany easily without raw queries,
    // we'll do a simple bounding box filter and then manual distance check if needed,
    // OR just fetch open jobs and filter in memory for this MVP.
    const jobs = await this.prisma.job.findMany({
      where: { 
        status: 'open',
        latitude: { not: null },
        longitude: { not: null }
      },
      include: {
        employer: {
          select: { name: true, avatar: true }
        }
      }
    });

    return jobs.filter(job => {
      const distance = this.calculateDistance(lat, lng, job.latitude!, job.longitude!);
      return distance <= radius;
    }).sort((a, b) => {
        const distA = this.calculateDistance(lat, lng, a.latitude!, a.longitude!);
        const distB = this.calculateDistance(lat, lng, b.latitude!, b.longitude!);
        return distA - distB;
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}
