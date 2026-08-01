import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersModule } from '@/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';

@Module({
  imports: [UsersModule],
  providers: [AuthService, EmailService, JwtService],
  controllers: [AuthController],
})
export class AuthModule {}
