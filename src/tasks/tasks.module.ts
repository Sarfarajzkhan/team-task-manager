import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { TasksController } from './tasks.controller';

import { TasksService } from './tasks.service';

import { Task } from './entities/task.entity';

import { User } from '../users/entities/user.entity';

import { Project } from '../projects/entities/project.entity';

import { ProjectMember } from '../projects/entities/project-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      User,
      Project,
      ProjectMember,
    ]),
  ],

  controllers: [TasksController],

  providers: [TasksService],

  exports: [TasksService],
})
export class TasksModule {}