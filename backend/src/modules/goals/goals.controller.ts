import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GoalsService } from './goals.service';
import { CreateGoalDto, UpdateGoalDto } from './dto/goal.dto';

@ApiTags('Goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('goals')
export class GoalsController {
  constructor(private goalsService: GoalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a savings goal' })
  create(@Request() req, @Body() dto: CreateGoalDto) {
    return this.goalsService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all goals with progress' })
  findAll(@Request() req) {
    return this.goalsService.findAll(req.user.id);
  }

  @Post(':id/contribute')
  @ApiOperation({ summary: 'Add funds to a goal' })
  contribute(@Request() req, @Param('id') id: string, @Body() dto: UpdateGoalDto) {
    return this.goalsService.contribute(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a goal' })
  delete(@Request() req, @Param('id') id: string) {
    return this.goalsService.delete(req.user.id, id);
  }
}
