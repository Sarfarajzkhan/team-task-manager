import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { TasksController } from './tasks.controller';

import { TasksService } from './tasks.service';

import { Task } from './entities/task.entity';

import { TaskComment } from './entities/task-comment.entity';
import { TaskAttachment } from './entities/task-attachment.entity';

import { User } from '../users/entities/user.entity';

import { Project } from '../projects/entities/project.entity';

import { ProjectMember } from '../projects/entities/project-member.entity';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      TaskComment,
      TaskAttachment,
      User,
      Project,
      ProjectMember,
    ]),
    NotificationsModule,
  ],

  controllers: [TasksController],

  providers: [TasksService],

  exports: [TasksService],
})
export class TasksModule {}