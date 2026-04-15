import { Controller, Get, Put, Patch, Body, UseGuards, Request } from '@nestjs/common';
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
  @ApiOperation({ summary: 'Get main dashboard metrics' })
  getDashboard(@Request() req) {
    return this.usersService.getDashboard(req.user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  updateProfile(@Request() req, @Body() body: { name?: string; phone?: string; avatar?: string }) {
    return this.usersService.updateProfile(req.user.id, body);
  }

  @Get('settings/language')
  @ApiOperation({ summary: 'Get user language preference' })
  getLanguage(@Request() req) {
    return this.usersService.getLanguage(req.user.id);
  }

  @Put('settings/language')
  @ApiOperation({ summary: 'Update user language preference' })
  setLanguage(@Request() req, @Body() body: { language: string }) {
    return this.usersService.setLanguage(req.user.id, body.language);
  }

  @Get('profile/dashboard')
  @ApiOperation({ summary: 'Get aggregated profile dashboard' })
  getProfileDashboard(@Request() req) {
    return this.usersService.getProfileDashboard(req.user.id);
  }

  @Get('settings/dashboard')
  @ApiOperation({ summary: 'Get unified settings dashboard' })
  getSettingsDashboard(@Request() req) {
    return this.usersService.getSettingsDashboard(req.user.id);
  }

  @Put('settings/update')
  @ApiOperation({ summary: 'Update unified user settings' })
  updateSettings(@Request() req, @Body() body: any) {
    return this.usersService.updateSettings(req.user.id, body);
  }
}
