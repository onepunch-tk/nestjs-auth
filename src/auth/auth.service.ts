import * as crypto from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { Response } from 'express';
import type { User } from '@/db/db.type';
import { UserService } from '@/users/user.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.userService.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('사용 중인 이메일입니다.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); //24시간

    const user = await this.userService.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
      verificationToken,
      verificationTokenExpiresAt,
    });

    void this.emailService.sendVerificationEmail(user.email, verificationToken);

    return {
      message: '회원가입이 완료되었습니다. 이메일로 발송된 인증 링크를 확인해주세요.',
    };
  }

  async verifyEmail(token: string, res: Response) {
    const user = await this.userService.findByVerificationToken(token);

    if (!user?.verificationToken) {
      throw new BadRequestException('유효하지 않은 인증 링크입니다.');
    }

    if (user.verificationTokenExpiresAt && user.verificationTokenExpiresAt < new Date()) {
      throw new BadRequestException('인증 링크가 만료되었습니다. 인증 메일을 다시 요청해주세요.');
    }

    await this.userService.update(user.id, {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpiresAt: null,
    });

    const tokens = await this.generateTokens(user);
    await this.saveRefrashToken(user.id, tokens.refreshToken);
    this.setRefreshTokenCookie(res, tokens.refreshToken);

    return {
      message: '이메일 인증이 완료되었습니다. 자동으로 로그인되었습니다.',
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.userService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('이메일 or 패스워드를 확인하세요.');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordMatch) {
      throw new UnauthorizedException('이메일 or 패스워드를 확인하세요.');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('서비스 이용을 위해 이메일 인증을 완료해주세요.');
    }

    const tokens = await this.generateTokens(user);
    await this.saveRefrashToken(user.id, tokens.refreshToken);
    this.setRefreshTokenCookie(res, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refresh(refreshToken: string | undefined, res: Response) {
    const UNAUTHORIZED_MESSAGE = '로그인이 만료되었습니다. 다시 로그인해주세요.';

    if (!refreshToken) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }

    let payload: { sub: string; email: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }

    const user = await this.userService.findById(payload.sub);

    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }

    const tokenMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);

    if (!tokenMatch) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }

    // 저장된 만료시간이 이미 지났으면 재로그인 필요
    if (!user.refreshTokenExpiresAt || user.refreshTokenExpiresAt <= new Date()) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }

    // 만료시간까지 남은 시간(초)
    const remainingSeconds = Math.floor((user.refreshTokenExpiresAt.getTime() - Date.now()) / 1000);

    const tokens = await this.generateTokens(user, remainingSeconds);
    await this.saveRefrashToken(user.id, tokens.refreshToken);
    this.setRefreshTokenCookie(res, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
    };
  }

  async forgotPassword(email: string) {
    const RESET_CODE_MESSAGE =
      '입력하신 이메일로 비밀번호 재설정 코드를 보냈습니다. 메일함을 확인해주세요.';
    const user = await this.userService.findByEmail(email);

    if (!user) {
      return {
        message: RESET_CODE_MESSAGE,
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); //1시간 만료

    await this.userService.update(user.id, {
      resetToken,
      resetTokenExpiresAt,
    });

    this.emailService.sendPasswordResetEmail(user.email, resetToken);

    return {
      message: RESET_CODE_MESSAGE,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userService.findByResetToken(token);

    if (!user?.resetToken) {
      throw new BadRequestException('유효하지 않은 재설정 코드입니다.');
    }

    if (user.resetTokenExpiresAt && user.resetTokenExpiresAt < new Date()) {
      throw new BadRequestException(
        '재설정 코드가 만료되었습니다. 비밀번호 재설정을 다시 요청해주세요.',
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.userService.update(user.id, {
      resetToken: null,
      resetTokenExpiresAt: null,
      passwordHash,
    });

    return {
      message: '비밀번호 재설정이 완료되었습니다. 다시 로그인해주세요.',
    };
  }

  async logout(userId: string, res: Response) {
    await this.userService.update(userId, { refreshTokenHash: null, refreshTokenExpiresAt: null });
    res.clearCookie('refresh_token');

    return { message: '정상적으로 로그아웃되었습니다.' };
  }

  private async generateTokens(user: User, refreshExpiresIn?: number) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
    });

    // 로그인은 기본 7일, refresh는 넘어온 남은 시간으로 캡
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: refreshExpiresIn ?? this.configService.get('JWT_REFRESH_EXPIRES_IN'),
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private async saveRefrashToken(userId: string, refreshToken: string) {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    // exp는 서명할 때 이미 계산된 절대 시각 — 여기선 다시 읽기만 함
    const { exp } = this.jwtService.decode<{ exp: number }>(refreshToken);
    await this.userService.update(userId, {
      refreshTokenHash,
      refreshTokenExpiresAt: new Date(exp * 1000), // exp는 초 단위라 Date용 ms로 변환
    });
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    const { exp } = this.jwtService.decode<{ exp: number }>(refreshToken);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: exp * 1000 - Date.now(),
    });
  }
}
