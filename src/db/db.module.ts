import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DB_CLIENT, DRIZZLE } from './db.constant';
import { type DbClient, DrizzleDB } from './db.type';
import * as schema from './schema';

@Global()
@Module({
  providers: [
    {
      provide: DB_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): DbClient => {
        const pool = new Pool({ connectionString: config.getOrThrow('DATABASE_URL') });

        return {
          db: drizzle(pool, { schema }),
          close: () => pool.end(),
        };
      },
    },
    {
      provide: DRIZZLE,
      inject: [DB_CLIENT],
      useFactory: (dbClient: DbClient): DrizzleDB => dbClient.db,
    },
  ],
  exports: [DRIZZLE],
})
export class DBModule implements OnApplicationShutdown {
  constructor(@Inject(DB_CLIENT) private readonly dbClient: DbClient) {}

  onApplicationShutdown() {
    return this.dbClient.close();
  }
}
