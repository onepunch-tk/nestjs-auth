import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { tasks, users } from './schema';

export type DrizzleDB = NodePgDatabase<typeof schema>;

export type DbClient = {
  db: DrizzleDB;
  close(): Promise<void>;
};

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
