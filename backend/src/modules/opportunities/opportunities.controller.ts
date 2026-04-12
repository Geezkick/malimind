import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OpportunitiesService } from './opportunities.service';

@ApiTags('Opportunities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('opportunities')
export class OpportunitiesController {
  constructor(private oppService: OpportunitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active gigs/jobs (opportunities)' })
  findAll() {
    return this.oppService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get opportunity details' })
  findOne(@Param('id') id: string) {
    return this.oppService.findOne(id);
  }
}
