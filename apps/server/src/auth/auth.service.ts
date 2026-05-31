import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import type { RegisterDto, LoginDto } from './auth.dto';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
const ACCESS_TTL_MS = 15 * 60 * 1000;
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  private async generateTokens(userId: number, phone: string, role: string) {
    const payload = { sub: userId, phone, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private toUserDto(user: {
    id: number;
    phone: string;
    email: string | null;
    nickname: string;
    avatar: string | null;
    role: string;
    createdAt: Date;
  }) {
    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  }

  setAuthCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    const isProd = this.config.get('NODE_ENV') === 'production';
    const base = {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax' as const,
      path: '/api',
    };
    res.cookie(ACCESS_COOKIE, tokens.accessToken, {
      ...base,
      maxAge: ACCESS_TTL_MS,
    });
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      ...base,
      maxAge: REFRESH_TTL_MS,
    });
  }

  clearAuthCookies(res: Response) {
    const isProd = this.config.get('NODE_ENV') === 'production';
    const base = {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax' as const,
      path: '/api',
    };
    res.clearCookie(ACCESS_COOKIE, base);
    res.clearCookie(REFRESH_COOKIE, base);
  }

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (exists) throw new ConflictException('该手机号已被注册');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        email: dto.email,
        password: hashed,
        nickname: dto.nickname,
        avatar: dto.avatar,
      },
    });

    const tokens = await this.generateTokens(user.id, user.phone, user.role);
    return { tokens, user: this.toUserDto(user) };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (!user) throw new UnauthorizedException('手机号或密码错误');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('手机号或密码错误');

    const tokens = await this.generateTokens(user.id, user.phone, user.role);
    return { tokens, user: this.toUserDto(user) };
  }

  async refresh(token: string | undefined) {
    if (!token) throw new UnauthorizedException('请先登录');
    try {
      const payload = await this.jwt.verifyAsync<{
        sub: number;
        phone: string;
        role: string;
      }>(token, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) throw new UnauthorizedException();
      return this.generateTokens(user.id, user.phone, user.role);
    } catch {
      throw new UnauthorizedException('Token 已过期，请重新登录');
    }
  }
}
