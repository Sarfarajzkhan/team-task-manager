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

  async getDashboardData(
    currentUser: User,
  ) {
    if (currentUser.role === Role.ADMIN) {
      return this.getAdminDashboard(
        currentUser,
      );
    }

    return this.getMemberDashboard(
      currentUser,
    );
  }

  /*
  ===========================================
  ADMIN DASHBOARD
  ===========================================
  */

  private async getAdminDashboard(
    currentUser: User,
  ) {
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
          status:
            TaskStatus.IN_PROGRESS,
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
        .andWhere(
          'task.status != :doneStatus',
          {
            doneStatus:
              TaskStatus.DONE,
          },
        )
        .getMany();

    const recentTasks =
      await this.taskRepository.find({
        order: {
          createdAt: 'DESC',
        },

        take: 5,
      });

    const completionRate =
      totalTasks === 0
        ? 0
        : Math.round(
            (completedTasks /
              totalTasks) *
              100,
          );

    const projects = await this.projectRepository.find({
      relations: ['members', 'members.user', 'tasks', 'tasks.assignedTo'],
      order: {
        createdAt: 'DESC',
      },
    });

    const projectSummaries = projects.map((project) => {
      const total = project.tasks.length;
      const completed = project.tasks.filter(
        (t) => t.status === TaskStatus.DONE,
      ).length;
      const inProgress = project.tasks.filter(
        (t) => t.status === TaskStatus.IN_PROGRESS,
      ).length;
      const pending = project.tasks.filter(
        (t) => t.status === TaskStatus.TODO,
      ).length;

      return {
        id: project.id,
        name: project.name,
        totalTasks: total,
        completedTasks: completed,
        inProgressTasks: inProgress,
        pendingTasks: pending,
        progress: total === 0 ? 0 : Math.round((completed / total) * 100),
        members: project.members.map((m) => m.user.name),
      };
    });

    return {
      role: currentUser.role,

      stats: {
        totalTasks,

        completedTasks,

        pendingTasks,

        inProgressTasks,

        overdueTasksCount: overdueTasks.length,

        totalProjects,

        completionRate,
      },

      projectSummaries,

      overdueTasks,

      recentTasks,
    };
  }

  /*
  ===========================================
  MEMBER DASHBOARD
  ===========================================
  */

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

          status:
            TaskStatus.IN_PROGRESS,
        },
      }),
    ]);

    const overdueTasks =
      await this.taskRepository
        .createQueryBuilder('task')
        .leftJoin(
          'task.assignedTo',
          'assignedTo',
        )
        .where(
          'assignedTo.id = :userId',
          {
            userId: currentUser.id,
          },
        )
        .andWhere(
          'task.dueDate < :today',
          {
            today: new Date(),
          },
        )
        .andWhere(
          'task.status != :doneStatus',
          {
            doneStatus:
              TaskStatus.DONE,
          },
        )
        .getMany();

    const recentTasks =
      await this.taskRepository.find({
        where: {
          assignedTo: {
            id: currentUser.id,
          },
        },

        order: {
          createdAt: 'DESC',
        },

        take: 5,
      });

    const completionRate =
      totalTasks === 0
        ? 0
        : Math.round(
            (completedTasks /
              totalTasks) *
              100,
          );

    return {
      role: currentUser.role,

      stats: {
        totalTasks,

        completedTasks,

        pendingTasks,

        inProgressTasks,

        overdueTasksCount:
          overdueTasks.length,

        completionRate,
      },

      overdueTasks,

      recentTasks,
    };
  }
}