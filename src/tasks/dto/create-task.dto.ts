import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: '작업 제목' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: '작업 상세 설명', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
