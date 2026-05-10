import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Task } from '../tasks/entities/task.entity';

import { Project } from '../projects/entities/project.entity';

import { User } from '../users/entities/user.entity';

import { TaskStatus } from '../common/enums/task-status.enum';

import { Role } from '../common/enums/role.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,

    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async getDashboard(currentUser: User) {
    if (currentUser.role === Role.ADMIN) {
      return this.getAdminDashboard();
    }

    return this.getMemberDashboard(currentUser);
  }

  private async getAdminDashboard() {
    const [
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      totalProjects,
    ] = await Promise.all([
      this.taskRepository.count(),

      this.taskRepository.count({
        where: {
          status: TaskStatus.DONE,
        },
      }),

      this.taskRepository.count({
        where: {
          status: TaskStatus.TODO,
        },
      }),

      this.taskRepository.count({
        where: {
          status: TaskStatus.IN_PROGRESS,
        },
      }),

      this.projectRepository.count(),
    ]);

    const overdueTasks =
      await this.taskRepository
        .createQueryBuilder('task')
        .where('task.dueDate < :today', {
          today: new Date(),
        })
        .andWhere('task.status != :doneStatus', {
          doneStatus: TaskStatus.DONE,
        })
        .getCount();

    const completionRate =
      totalTasks === 0
        ? 0
        : Math.round(
            (completedTasks / totalTasks) * 100,
          );

    return {
      role: Role.ADMIN,

      totalTasks,

      completedTasks,

      pendingTasks,

      inProgressTasks,

      overdueTasks,

      totalProjects,

      completionRate: `${completionRate}%`,
    };
  }

  private async getMemberDashboard(
    currentUser: User,
  ) {
    const [
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
    ] = await Promise.all([
      this.taskRepository.count({
        where: {
          assignedTo: {
            id: currentUser.id,
          },
        },
      }),

      this.taskRepository.count({
        where: {
          assignedTo: {
            id: currentUser.id,
          },
          status: TaskStatus.DONE,
        },
      }),

      this.taskRepository.count({
        where: {
          assignedTo: {
            id: currentUser.id,
          },
          status: TaskStatus.TODO,
        },
      }),

      this.taskRepository.count({
        where: {
          assignedTo: {
            id: currentUser.id,
          },
          status: TaskStatus.IN_PROGRESS,
        },
      }),
    ]);

    const overdueTasks =
      await this.taskRepository
        .createQueryBuilder('task')
        .leftJoin('task.assignedTo', 'assignedTo')
        .where('assignedTo.id = :userId', {
          userId: currentUser.id,
        })
        .andWhere('task.dueDate < :today', {
          today: new Date(),
        })
        .andWhere('task.status != :doneStatus', {
          doneStatus: TaskStatus.DONE,
        })
        .getCount();

    const completionRate =
      totalTasks === 0
        ? 0
        : Math.round(
            (completedTasks / totalTasks) * 100,
          );

    return {
      role: Role.MEMBER,

      totalTasks,

      completedTasks,

      pendingTasks,

      inProgressTasks,

      overdueTasks,

      completionRate: `${completionRate}%`,
    };
  }
}