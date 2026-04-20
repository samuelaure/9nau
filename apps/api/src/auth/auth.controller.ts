import { Body, Controller, Get, Param, Post, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ServiceAuthGuard } from '../common/guards/service-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { LinkTelegramDto, LoginDto, RefreshDto, RegisterDto, VerifyLinkTokenDto } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: { sub: string }) {
    return this.auth.me(user.sub);
  }

  @Post('link-telegram')
  @UseGuards(JwtAuthGuard)
  linkTelegram(@CurrentUser() user: { sub: string }, @Body() dto: LinkTelegramDto) {
    return this.auth.linkTelegram(user.sub, dto.telegramId);
  }

  /** Generate a one-time Telegram linking token (5-minute TTL) */
  @Post('link-token')
  @UseGuards(JwtAuthGuard)
  generateLinkToken(@CurrentUser() user: { sub: string }) {
    return this.auth.generateLinkToken(user.sub);
  }

  /** Service-to-service: consume link token and bind telegramId to user */
  @Post('link-token/verify')
  @UseGuards(ServiceAuthGuard)
  verifyLinkToken(@Body() dto: VerifyLinkTokenDto) {
    return this.auth.verifyLinkToken(dto.token, dto.telegramId);
  }

  /** Service-to-service: look up a User by their telegramId */
  @Get('by-telegram/:telegramId')
  @UseGuards(ServiceAuthGuard)
  byTelegram(@Param('telegramId') telegramId: string) {
    return this.auth.findByTelegramId(telegramId);
  }

  /** Service-to-service: look up a User by email (used by flownau for workspace invites) */
  @Get('lookup')
  @UseGuards(ServiceAuthGuard)
  async lookupByEmail(@Query('email') email: string) {
    const user = await this.auth.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
