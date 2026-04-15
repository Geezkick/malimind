import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, SocialAuthDto } from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login and get JWT token' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('google')
  @HttpCode(200)
  @ApiOperation({ summary: 'Google authentication' })
  googleAuth(@Body() dto: SocialAuthDto) {
    return this.authService.googleAuth(dto);
  }

  @Post('apple')
  @HttpCode(200)
  @ApiOperation({ summary: 'Apple authentication' })
  appleAuth(@Body() dto: SocialAuthDto) {
    return this.authService.appleAuth(dto);
  }
}
