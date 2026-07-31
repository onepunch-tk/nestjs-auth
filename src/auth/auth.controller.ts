import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import type { User } from '@/db/db.type';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /api/auth/register
  @Public()
  @Post('register')
  @ApiOperation({ summary: '회원가입' })
  async register(@Body() dto: RegisterDto) {
    return await this.authService.register(dto);
  }

  // GET /api/auth/verify-email?token=...
  @Public()
  @Get('verify-email')
  @ApiOperation({ summary: '이메일 인증 & 로그인' })
  async verifyEmail(@Query('token') token: string, @Res({ passthrough: true }) res: Response) {
    return await this.authService.verifyEmail(token, res);
  }

  // POST /api/aut/login
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그인 & access,refresh token 응답' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return await this.authService.login(dto, res);
  }

  // POST /api/auth/refresh
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'cookie에 동봉된 refresh token을 사용하여 refresh token 갱신' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    return await this.authService.refresh(refreshToken, res);
  }

  // POST /api/auth/logout
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '로그아웃 & token 무효화' })
  async logout(@CurrentUser() user: User, @Res({ passthrough: true }) res: Response) {
    return await this.authService.logout(user.id, res);
  }

  // Get /api/auth/me
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: '현재 로그인된 유저 반환' })
  me(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified,
    };
  }

  // POST /api/auth/forgot-password
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '패스워드 재설정 요청' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(dto.email);
  }

  // POST /api/auth/reset-password
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '이메일 인증 & 패스워드 재설정' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return await this.authService.resetPassword(dto.token, dto.password);
  }
}
