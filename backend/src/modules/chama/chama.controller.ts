import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChamaService } from './chama.service';
import { CreateChamaDto, JoinChamaDto, ContributeDto } from './dto/chama.dto';

@ApiTags('Chamas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chamas')
export class ChamaController {
  constructor(private chamaService: ChamaService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Chama (group)' })
  create(@Request() req, @Body() dto: CreateChamaDto) {
    return this.chamaService.create(req.user.id, dto);
  }

  @Post('join')
  @ApiOperation({ summary: 'Join a Chama via invite code' })
  join(@Request() req, @Body() dto: JoinChamaDto) {
    return this.chamaService.join(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Chamas user belongs to' })
  findAll(@Request() req) {
    return this.chamaService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Chama details' })
  getDetails(@Request() req, @Param('id') id: string) {
    return this.chamaService.getDetails(req.user.id, id);
  }

  @Post(':id/contribute')
  @ApiOperation({ summary: 'Contribute to a Chama' })
  contribute(@Request() req, @Param('id') id: string, @Body() dto: ContributeDto) {
    return this.chamaService.contribute(req.user.id, id, dto);
  }
}
