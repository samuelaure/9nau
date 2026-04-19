import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './auth.dto';

const LINK_TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes

const ACCESS_TOKEN_EXPIRES = '30d';
const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        workspaces: {
          create: {
            workspace: {
              create: { name: dto.workspaceName ?? `${dto.name ?? dto.email}'s Workspace` },
            },
          },
        },
      },
      include: { workspaces: { include: { workspace: true } } },
    });

    return this.issueTokens(user.id, user.email);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens(user.id, user.email);
  }

  async refresh(refreshToken: string) {
    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) await this.prisma.session.delete({ where: { id: session.id } });
      throw new UnauthorizedException('Refresh token invalid or expired');
    }

    await this.prisma.session.delete({ where: { id: session.id } });
    return this.issueTokens(session.user.id, session.user.email);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { workspaces: { include: { workspace: true } } },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash: _, ...safe } = user;
    return safe;
  }

  async findByTelegramId(telegramId: string) {
    const user = await this.prisma.user.findUnique({ where: { telegramId } });
    if (!user) return { found: false };
    const { passwordHash: _, ...safe } = user;
    return { found: true, user: safe };
  }

  async generateLinkToken(userId: string): Promise<{ token: string }> {
    await this.prisma.authLinkToken.deleteMany({ where: { userId } });
    const token = crypto.randomBytes(32).toString('hex');
    await this.prisma.authLinkToken.create({
      data: { token, userId, expiresAt: new Date(Date.now() + LINK_TOKEN_TTL_MS) },
    });
    return { token };
  }

  async verifyLinkToken(token: string, telegramId: string): Promise<{ ok: boolean }> {
    const record = await this.prisma.authLinkToken.findUnique({ where: { token } });
    if (!record || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired link token');
    }
    await this.prisma.authLinkToken.delete({ where: { token } });
    return this.linkTelegram(record.userId, telegramId);
  }

  async linkTelegram(userId: string, telegramId: string) {
    const existing = await this.prisma.user.findUnique({ where: { telegramId } });
    if (existing && existing.id !== userId) {
      throw new ConflictException('Telegram account already linked to another user');
    }
    await this.prisma.user.update({ where: { id: userId }, data: { telegramId } });
    return { ok: true };
  }

  private async issueTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessToken = this.jwt.sign(payload, { expiresIn: ACCESS_TOKEN_EXPIRES });

    const rawRefresh = this.jwt.sign(payload, { expiresIn: '7d' });
    await this.prisma.session.create({
      data: {
        userId,
        refreshToken: rawRefresh,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS),
      },
    });

    return { accessToken, refreshToken: rawRefresh };
  }
}
