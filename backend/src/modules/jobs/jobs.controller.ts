import { Controller, Get, Post, Body, Param, UseGuards, Query, Req } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto, NearbyJobsQueryDto, ApplyJobDto } from './dto/jobs.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  create(@Req() req: any, @Body() createJobDto: CreateJobDto) {
    return this.jobsService.create(req.user.id, createJobDto);
  }

  @Get()
  findAll() {
    return this.jobsService.findAll();
  }

  @Get('nearby')
  findNearby(@Query() query: NearbyJobsQueryDto) {
    // Convert strings from query to numbers
    const lat = query.lat ? parseFloat(query.lat as any) : undefined;
    const lng = query.lng ? parseFloat(query.lng as any) : undefined;
    const radius = query.radius ? parseFloat(query.radius as any) : undefined;
    
    return this.jobsService.findNearby({ lat, lng, radius });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Post('apply')
  apply(@Req() req: any, @Body() dto: ApplyJobDto) {
    return this.jobsService.apply(req.user.id, dto.jobId);
  }

  @Get('my-applications')
  getMyApplications(@Req() req: any) {
    return this.jobsService.getMyApplications(req.user.id);
  }
}
