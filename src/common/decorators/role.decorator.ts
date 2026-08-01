import { SetMetadata } from '@nestjs/common';

export type Role = 'user' | 'admin';

export const USER_ROLE_KEY = 'USER_ROLE_KEY';

export const Roles = (...roles: Role[]) => SetMetadata(USER_ROLE_KEY, roles);
