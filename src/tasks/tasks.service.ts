import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Task } from './entities/task.entity';

import { TaskComment } from './entities/task-comment.entity';

import { User } from '../users/entities/user.entity';
import { TaskAttachment } from './entities/task-attachment.entity';

import { Project } from '../projects/entities/project.entity';

import { ProjectMember } from '../projects/entities/project-member.entity';

import { CreateTaskDto } from './dto/create-task.dto';

import { UpdateTaskStatusDto } from './dto/update-task-status.dto';

import { Role } from '../common/enums/role.enum';

import { TaskStatus } from '../common/enums/task-status.enum';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,

    @InjectRepository(TaskComment)
    private readonly taskCommentRepository: Repository<TaskComment>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,

    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,

    @InjectRepository(TaskAttachment)
    private readonly taskAttachmentRepository: Repository<TaskAttachment>,

    private readonly notificationsService: NotificationsService,
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
      // Auto-add the assigned user to the project members
      await this.projectMemberRepository.insert({
        user: { id: assignedUser.id },
        project: { id: project.id },
      });
    }

    const parsedDueDate = new Date(dueDate);

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

    // Notify assigned user
    await this.notificationsService.create(
      assignedUser,
      `You have been assigned a new task: ${task.title}`,
      `/tasks/${task.id}`,
    );

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

  async getTaskById(taskId: string, currentUser: User) {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['assignedTo', 'createdBy', 'project', 'comments', 'comments.author', 'attachments'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Only admin or the assigned user can view the task
    if (
      currentUser.role !== Role.ADMIN &&
      task.assignedTo.id !== currentUser.id
    ) {
      throw new ForbiddenException('You cannot view this task');
    }

    return task;
  }

  async addComment(
    taskId: string,
    content: string,
    currentUser: User,
  ) {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['assignedTo'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Only admin or the assigned user can comment
    if (
      currentUser.role !== Role.ADMIN &&
      task.assignedTo.id !== currentUser.id
    ) {
      throw new ForbiddenException('You cannot comment on this task');
    }

    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Comment cannot be empty');
    }

    const comment = this.taskCommentRepository.create({
      content: content.trim(),
      author: currentUser,
      task,
    });

    await this.taskCommentRepository.save(comment);

    // Notify others
    if (currentUser.id === task.assignedTo.id) {
      // Notify admin (project creator)
      const project = await this.projectRepository.findOne({
        where: { id: task.project?.id || (await this.taskRepository.findOne({ where: { id: taskId }, relations: ['project'] }))!.project.id },
        relations: ['createdBy'],
      });
      if (project && project.createdBy) {
        await this.notificationsService.create(
          project.createdBy,
          `${currentUser.name} commented on task: ${task.title}`,
          `/tasks/${taskId}`,
        );
      }
    } else {
      // Notify assigned user
      await this.notificationsService.create(
        task.assignedTo,
        `Admin ${currentUser.name} commented on your task: ${task.title}`,
        `/tasks/${taskId}`,
      );
    }

    return { message: 'Comment added successfully', comment };
  }

  async updateTaskStatus(
    taskId: string,
    updateTaskStatusDto: UpdateTaskStatusDto,
    currentUser: User,
  ) {
    console.log(`[TasksService] Updating status for task ${taskId}. Target status: ${updateTaskStatusDto.status}`);
    
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['assignedTo'],
    });

    if (!task) {
      console.error(`[TasksService] Task ${taskId} not found`);
      throw new NotFoundException('Task not found');
    }

    // Permission check
    const isOwner = task.assignedTo && task.assignedTo.id === currentUser.id;
    const isAdmin = currentUser.role === Role.ADMIN;

    if (!isAdmin && !isOwner) {
      console.error(`[TasksService] Permission denied for user ${currentUser.email} on task ${taskId}`);
      throw new ForbiddenException('You cannot update this task');
    }

    console.log(`[TasksService] Current status: ${task.status}. Updating to: ${updateTaskStatusDto.status}`);
    
    // Direct update to be sure
    await this.taskRepository.update(taskId, {
      status: updateTaskStatusDto.status,
    });

    // Notify admin if member updated it
    if (currentUser.role !== Role.ADMIN) {
      const project = await this.projectRepository.findOne({
        where: { id: (await this.taskRepository.findOne({ where: { id: taskId }, relations: ['project'] }))!.project.id },
        relations: ['createdBy'],
      });
      if (project && project.createdBy) {
        await this.notificationsService.create(
          project.createdBy,
          `Task "${task.title}" was marked as ${updateTaskStatusDto.status} by ${currentUser.name}`,
          `/tasks/${taskId}`,
        );
      }
    } else if (currentUser.id !== task.assignedTo.id) {
       // Notify member if admin updated it
       await this.notificationsService.create(
        task.assignedTo,
        `Admin updated your task "${task.title}" status to ${updateTaskStatusDto.status}`,
        `/tasks/${taskId}`,
      );
    }

    // Verify update
    const updatedTask = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['assignedTo'],
    });

    console.log(`[TasksService] Task ${taskId} update complete. New status in DB: ${updatedTask?.status}`);

    return {
      message: 'Task status updated successfully',
      task: updatedTask,
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

  async getTasksForFrontend(currentUser: User) {
    if (currentUser.role === Role.ADMIN) {
      return this.taskRepository.find({
        relations: [
          'assignedTo',
          'project',
          'createdBy',
        ],

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

      relations: [
        'assignedTo',
        'project',
        'createdBy',
      ],

      order: {
        createdAt: 'DESC',
      },
    });
  }

  async deleteTask(
    taskId: string,
    currentUser: User,
  ) {
    if (currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'Only admins can delete tasks',
      );
    }

    const task = await this.taskRepository.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.taskRepository.remove(task);

    return { message: 'Task deleted successfully' };
  }

  async addAttachment(
    taskId: string,
    file: any,
    currentUser: User,
  ) {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['assignedTo'],
    });

    if (!task) throw new NotFoundException('Task not found');

    if (
      currentUser.role !== Role.ADMIN &&
      task.assignedTo.id !== currentUser.id
    ) {
      throw new ForbiddenException('You cannot upload files to this task');
    }

    const attachment = this.taskAttachmentRepository.create({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      task,
      uploadedBy: currentUser,
    });

    await this.taskAttachmentRepository.save(attachment);

    // Notify others
    const message = `${currentUser.name} uploaded a file to task: ${task.title}`;
    if (currentUser.id === task.assignedTo.id) {
      const project = await this.projectRepository.findOne({
        where: { id: (await this.taskRepository.findOne({ where: { id: taskId }, relations: ['project'] }))!.project.id },
        relations: ['createdBy'],
      });
      if (project && project.createdBy) {
        await this.notificationsService.create(project.createdBy, message, `/tasks/${taskId}`);
      }
    } else {
      await this.notificationsService.create(task.assignedTo, message, `/tasks/${taskId}`);
    }

    return { message: 'File uploaded successfully', attachment };
  }
}