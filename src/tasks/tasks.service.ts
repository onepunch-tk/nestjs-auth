import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE } from '@/db/db.constant';
import type { DrizzleDB } from '@/db/db.type';
import { tasks } from '@/db/schema';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAllByUserId(userId: string) {
    return await this.db.query.tasks.findMany({ where: eq(tasks.userId, userId) });
  }

  async create(userId: string, dto: CreateTaskDto) {
    const [task] = await this.db
      .insert(tasks)
      .values({
        ...dto,
        userId,
      })
      .returning();

    return task;
  }

  async update(id: string, userId: string, data: Partial<CreateTaskDto>) {
    const task = await this.db.query.tasks.findFirst({ where: eq(tasks.id, id) });

    if (!task) {
      throw new NotFoundException('작업을 찾을 수 없습니다.');
    }

    if (task.userId !== userId) {
      throw new ForbiddenException('작업 수정 권한이 없습니다.');
    }

    const [update] = await this.db
      .update(tasks)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();

    return update;
  }

  async delete(id: string, userId: string) {
    const task = await this.db.query.tasks.findFirst({ where: eq(tasks.id, id) });

    if (!task) {
      throw new NotFoundException('작업을 찾을 수 없습니다.');
    }

    if (task.userId !== userId) {
      throw new ForbiddenException('작업 수정 권한이 없습니다.');
    }

    await this.db.delete(tasks).where(eq(tasks.id, id));

    return { message: '작업을 삭제했습니다.' };
  }
}
