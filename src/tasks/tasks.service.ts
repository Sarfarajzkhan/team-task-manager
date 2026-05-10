import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Task } from './entities/task.entity';

import { User } from '../users/entities/user.entity';

import { Project } from '../projects/entities/project.entity';

import { ProjectMember } from '../projects/entities/project-member.entity';

import { CreateTaskDto } from './dto/create-task.dto';

import { UpdateTaskStatusDto } from './dto/update-task-status.dto';

import { Role } from '../common/enums/role.enum';

import { TaskStatus } from '../common/enums/task-status.enum';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,

    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
  ) {}

  async createTask(
    createTaskDto: CreateTaskDto,
    currentUser: User,
  ) {
    const {
      assignedToUserId,
      projectId,
      dueDate,
    } = createTaskDto;

    const project = await this.projectRepository.findOne({
      where: {
        id: projectId,
      },
      relations: ['createdBy'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const assignedUser =
      await this.userRepository.findOne({
        where: {
          id: assignedToUserId,
        },
      });

    if (!assignedUser) {
      throw new NotFoundException(
        'Assigned user not found',
      );
    }

    const isMember =
      await this.projectMemberRepository.findOne({
        where: {
          user: {
            id: assignedUser.id,
          },
          project: {
            id: project.id,
          },
        },
      });

    if (!isMember) {
      throw new BadRequestException(
        'User is not a member of this project',
      );
    }

    const parsedDueDate = new Date(dueDate);

    if (parsedDueDate < new Date()) {
      throw new BadRequestException(
        'Due date cannot be in the past',
      );
    }

    const task = this.taskRepository.create({
      title: createTaskDto.title,
      description: createTaskDto.description,
      priority: createTaskDto.priority,
      dueDate: parsedDueDate,
      assignedTo: assignedUser,
      createdBy: currentUser,
      project,
    });

    await this.taskRepository.save(task);

    return {
      message: 'Task created successfully',
      task,
    };
  }

  async getTasks(currentUser: User) {
    if (currentUser.role === Role.ADMIN) {
      return this.taskRepository.find({
        order: {
          createdAt: 'DESC',
        },
      });
    }

    return this.taskRepository.find({
      where: {
        assignedTo: {
          id: currentUser.id,
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async updateTaskStatus(
    taskId: string,
    updateTaskStatusDto: UpdateTaskStatusDto,
    currentUser: User,
  ) {
    const task = await this.taskRepository.findOne({
      where: {
        id: taskId,
      },
      relations: ['assignedTo'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (
      currentUser.role !== Role.ADMIN &&
      task.assignedTo.id !== currentUser.id
    ) {
      throw new ForbiddenException(
        'You cannot update this task',
      );
    }

    task.status = updateTaskStatusDto.status;

    await this.taskRepository.save(task);

    return {
      message: 'Task status updated successfully',
      task,
    };
  }

  async getOverdueTasks(currentUser: User) {
    const queryBuilder =
      this.taskRepository.createQueryBuilder('task');

    queryBuilder
      .leftJoinAndSelect('task.assignedTo', 'assignedTo')
      .leftJoinAndSelect('task.project', 'project')
      .where('task.dueDate < :today', {
        today: new Date(),
      })
      .andWhere('task.status != :doneStatus', {
        doneStatus: TaskStatus.DONE,
      });

    if (currentUser.role !== Role.ADMIN) {
      queryBuilder.andWhere(
        'assignedTo.id = :userId',
        {
          userId: currentUser.id,
        },
      );
    }

    return queryBuilder.getMany();
  }
}