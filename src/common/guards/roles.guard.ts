import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Role, USER_ROLE_KEY } from '../decorators/role.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[]>(USER_ROLE_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (!roles || roles.length === 0) {
      return true;
    }

    const { user } = ctx.switchToHttp().getRequest<Request>();

    if (!user) {
      throw new UnauthorizedException('로그인이 만료되었습니다. 다시 로그인해주세요.');
    }

    if (!roles.includes(user.role)) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }

    return true;
  }
}
