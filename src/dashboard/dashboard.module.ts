import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { DashboardController } from './dashboard.controller';

import { DashboardService } from './dashboard.service';

import { Task } from '../tasks/entities/task.entity';

import { Project } from '../projects/entities/project.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      Project,
    ]),
  ],

  controllers: [DashboardController],

  providers: [DashboardService],

  exports: [DashboardService],
})
export class DashboardModule {}