import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserModule } from '@/users/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';

@Module({
  imports: [UserModule],
  providers: [AuthService, EmailService, JwtService],
  controllers: [AuthController],
})
export class AuthModule {}
