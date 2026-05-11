import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { TasksService } from './tasks.service';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

import { CurrentUser } from '../common/decorators/current-user.decorator';

import { User } from '../users/entities/user.entity';

import { CreateTaskDto } from './dto/create-task.dto';

import { UpdateTaskStatusDto } from './dto/update-task-status.dto';

@Controller('api/tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
  ) {}

  @Post()
  createTask(
    @Body() createTaskDto: CreateTaskDto,

    @CurrentUser() currentUser: User,
  ) {
    return this.tasksService.createTask(
      createTaskDto,
      currentUser,
    );
  }

  @Get()
  getTasks(@CurrentUser() currentUser: User) {
    return this.tasksService.getTasks(
      currentUser,
    );
  }

  @Patch(':taskId/status')
  updateTaskStatus(
    @Param('taskId') taskId: string,

    @Body()
    updateTaskStatusDto: UpdateTaskStatusDto,

    @CurrentUser() currentUser: User,
  ) {
    return this.tasksService.updateTaskStatus(
      taskId,
      updateTaskStatusDto,
      currentUser,
    );
  }

  @Get('overdue/list')
  getOverdueTasks(
    @CurrentUser() currentUser: User,
  ) {
    return this.tasksService.getOverdueTasks(
      currentUser,
    );
  }
}