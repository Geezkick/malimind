import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SynergyService } from './synergy.service';
import { CreateChamaDto, JoinChamaDto, ContributeDto } from './dto/synergy.dto';

@ApiTags('Synergy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('synergy')
export class SynergyController {
  constructor(private synergyService: SynergyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Synergy (group)' })
  create(@Request() req, @Body() dto: CreateChamaDto) {
    return this.synergyService.create(req.user.id, dto);
  }

  @Post('join')
  @ApiOperation({ summary: 'Join a Synergy via invite code' })
  join(@Request() req, @Body() dto: JoinChamaDto) {
    return this.synergyService.join(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Synergies user belongs to' })
  findAll(@Request() req) {
    return this.synergyService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Synergy details' })
  getDetails(@Request() req, @Param('id') id: string) {
    return this.synergyService.getDetails(req.user.id, id);
  }

  @Post(':id/contribute')
  @ApiOperation({ summary: 'Contribute to a Synergy' })
  contribute(@Request() req, @Param('id') id: string, @Body() dto: ContributeDto) {
    return this.synergyService.contribute(req.user.id, id, dto);
  }
}
