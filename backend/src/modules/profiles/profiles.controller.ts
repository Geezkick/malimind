import { Controller, Get, Post, Body, UseGuards, Req, Param } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { UpdateSkillProfileDto, CreateRatingDto } from './dto/profiles.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post('my')
  upsertProfile(@Req() req: any, @Body() dto: UpdateSkillProfileDto) {
    return this.profilesService.upsertProfile(req.user.id, dto);
  }

  @Get('my')
  getMyProfile(@Req() req: any) {
    return this.profilesService.getProfile(req.user.id);
  }

  @Get('workers')
  findWorkers() {
    return this.profilesService.findWorkers({});
  }

  @Get(':userId')
  getProfile(@Param('userId') userId: string) {
    return this.profilesService.getProfile(userId);
  }

  @Post('rate')
  addRating(@Req() req: any, @Body() dto: CreateRatingDto) {
    return this.profilesService.addRating(req.user.id, dto);
  }
}
