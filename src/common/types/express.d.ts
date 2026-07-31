import { User } from '@/db/db.type';
import 'express';

declare module 'express' {
  interface Request {
    cookies: {
      refresh_token?: string;
      [key: string]: string | undefined;
    };

    user?: User;
  }
}
