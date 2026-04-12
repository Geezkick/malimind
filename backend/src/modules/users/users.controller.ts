import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@Request() req) {
    return this.usersService.getMe(req.user.id);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get home dashboard data' })
  getDashboard(@Request() req) {
    return this.usersService.getDashboard(req.user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  updateProfile(@Request() req, @Body() body: { name?: string; phone?: string; avatar?: string }) {
    return this.usersService.updateProfile(req.user.id, body);
  }
}
