import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { User } from '@/db/db.type';
import { CreateTaskDto } from './dto/create-task.dto';
import { TasksService } from './tasks.service';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: '로그인한 사용자의 작업 목록을 반환' })
  async findAll(@CurrentUser() user: User) {
    return await this.tasksService.findAllByUserId(user.id);
  }

  @Post()
  @ApiOperation({ summary: '작업 생성' })
  async create(@CurrentUser() user: User, @Body() dto: CreateTaskDto) {
    return await this.tasksService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '작업 수정' })
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: Partial<CreateTaskDto>,
  ) {
    return await this.tasksService.update(id, user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '작업 삭제' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    return await this.tasksService.delete(id, user.id);
  }
}
