import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ServiceAuthGuard } from '../common/guards/service-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { LinkTelegramDto, LoginDto, RefreshDto, RegisterDto } from './auth.dto';

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

  /** Service-to-service: look up a User by their telegramId */
  @Get('by-telegram/:telegramId')
  @UseGuards(ServiceAuthGuard)
  byTelegram(@Param('telegramId') telegramId: string) {
    return this.auth.findByTelegramId(telegramId);
  }
}
