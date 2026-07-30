import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export type DrizzleDB = NodePgDatabase<typeof schema>;

export type DbClient = {
  db: DrizzleDB;
  close(): Promise<void>;
};
