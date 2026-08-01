import { Controller, Delete, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@/common/decorators/role.decorator';
import { UsersService } from '@/users/users.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly usersService: UsersService) {}

  @Get('users')
  @ApiOperation({ summary: 'admin - 전체 사용자 조회' })
  async findAll() {
    return await this.usersService.findAll();
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'admin - 사용자 삭제' })
  async remove(@Param('id') id: string) {
    return await this.usersService.delete(id);
  }
}
