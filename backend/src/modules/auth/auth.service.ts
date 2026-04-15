import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import * as appleSignin from 'apple-signin-auth';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto, SocialAuthDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {
    // Accept tokens from any registered Google client (web + iOS + Android)
    this.googleClient = new OAuth2Client();
  }

  // ─── Email / Password ────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashed,
        phone: dto.phone,
        wallet: { create: { balance: 0 } },
      },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    });

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return { user, token };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password ?? '');
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    const { password, ...safeUser } = user;
    return { user: safeUser, token };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true },
    });
  }

  // ─── Google OAuth ─────────────────────────────────────────────────────────────

  async googleAuth(dto: SocialAuthDto) {
    let payload: any;
    try {
      // The frontend sends a Google ID token; verify without specifying audience
      // so any of the app's registered client IDs are accepted.
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.token,
        audience: process.env.GOOGLE_CLIENT_ID, // optional audience check
      });
      payload = ticket.getPayload();
    } catch (err) {
      throw new BadRequestException('Invalid Google token');
    }

    if (!payload?.email) {
      throw new BadRequestException('Google token did not return an email');
    }

    return this.upsertSocialUser({
      email: payload.email,
      name: payload.name || dto.name || payload.email.split('@')[0],
    });
  }

  // ─── Apple Sign-In ───────────────────────────────────────────────────────────

  async appleAuth(dto: SocialAuthDto) {
    let applePayload: any;
    try {
      applePayload = await appleSignin.verifyIdToken(dto.token, {
        // Allow a 5-minute clock skew
        ignoreExpiration: false,
      });
    } catch (err) {
      throw new BadRequestException('Invalid Apple identity token');
    }

    if (!applePayload?.email && !applePayload?.sub) {
      throw new BadRequestException('Apple token did not return usable identity');
    }

    // Apple may hide the real email on subsequent sign-ins; use sub (user sub) as fallback key
    const email =
      applePayload.email || `${applePayload.sub}@privaterelay.appleid.com`;

    return this.upsertSocialUser({
      email,
      name: dto.name || email.split('@')[0],
    });
  }

  // ─── Shared upsert helper ────────────────────────────────────────────────────

  private async upsertSocialUser({ email, name }: { email: string; name: string }) {
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          password: null, // social users have no password
          wallet: { create: { balance: 0 } },
        },
      });
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    const { password, ...safeUser } = user;
    return { user: safeUser, token };
  }
}
