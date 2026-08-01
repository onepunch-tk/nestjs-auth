import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '@/db/db.constant';
import type { DrizzleDB, NewUser } from '@/db/db.type';
import { users } from '@/db/schema';

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findByResetToken(token: string) {
    return await this.db.query.users.findFirst({
      where: eq(users.resetToken, token),
    });
  }

  async findByEmail(email: string) {
    return await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });
  }

  async findById(id: string) {
    return await this.db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  async findByVerificationToken(token: string) {
    return await this.db.query.users.findFirst({
      where: eq(users.verificationToken, token),
    });
  }

  async create(data: NewUser) {
    const [user] = await this.db.insert(users).values(data).returning();
    return user;
  }

  async update(id: string, data: Partial<typeof users.$inferInsert>) {
    const [user] = await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async findAll() {
    return await this.db.query.users.findMany();
  }

  async delete(id: string) {
    await this.db.delete(users).where(eq(users.id, id));
  }
}
