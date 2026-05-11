import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { User } from '../users/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,

    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createProject(
    createProjectDto: CreateProjectDto,
    currentUser: User,
  ) {
    const project = this.projectRepository.create({
      ...createProjectDto,
      createdBy: currentUser,
    });

    await this.projectRepository.save(project);

    // Automatically add the creator as a project member
    await this.projectMemberRepository.insert({
      user: { id: currentUser.id },
      project: { id: project.id },
    });

    return {
      message: 'Project created successfully',
      project,
    };
  }

  async getProjects(currentUser: User) {
    if (currentUser.role === Role.ADMIN) {
      return this.projectRepository.find({
        relations: ['members', 'members.user'],
        order: {
          createdAt: 'DESC',
        },
      });
    }

    const memberships = await this.projectMemberRepository.find({
      where: {
        user: {
          id: currentUser.id,
        },
      },
      relations: ['project', 'project.members', 'project.members.user'],
    });

    return memberships.map(
      (membership) => membership.project,
    );
  }

  async addMember(
    projectId: string,
    addProjectMemberDto: AddProjectMemberDto,
    currentUser: User,
  ) {
    const project = await this.projectRepository.findOne({
      where: {
        id: projectId,
      },
      relations: ['createdBy'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (
      currentUser.role !== Role.ADMIN &&
      project.createdBy.id !== currentUser.id
    ) {
      throw new ForbiddenException(
        'You cannot manage this project',
      );
    }

    const user = await this.userRepository.findOne({
      where: {
        id: addProjectMemberDto.userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingMember =
      await this.projectMemberRepository.findOne({
        where: {
          user: {
            id: user.id,
          },
          project: {
            id: project.id,
          },
        },
      });

    if (existingMember) {
      throw new BadRequestException(
        'User already added to project',
      );
    }

    await this.projectMemberRepository.insert({
      user: { id: user.id },
      project: { id: project.id },
    });

    return {
      message: 'Member added successfully',
    };
  }

  async removeMember(
    projectId: string,
    userId: string,
    currentUser: User,
  ) {
    const project = await this.projectRepository.findOne({
      where: {
        id: projectId,
      },
      relations: ['createdBy'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (
      currentUser.role !== Role.ADMIN &&
      project.createdBy.id !== currentUser.id
    ) {
      throw new ForbiddenException(
        'You cannot manage this project',
      );
    }

    const member =
      await this.projectMemberRepository.findOne({
        where: {
          user: {
            id: userId,
          },
          project: {
            id: projectId,
          },
        },
      });

    if (!member) {
      throw new NotFoundException(
        'Member not found in project',
      );
    }

    await this.projectMemberRepository.remove(member);

    return {
      message: 'Member removed successfully',
    };
  }

  async getProjectById(
    projectId: string,
  ) {
    const project =
      await this.projectRepository.findOne({
        where: {
          id: projectId,
        },
        relations: {
          members: {
            user: true,
          },
          tasks: {
            assignedTo: true,
          },
          createdBy: true,
        },
      });

    if (!project) {
      throw new NotFoundException(
        'Project not found',
      );
    }

    return project;
  }

  async getProjectsWithStats() {
    const projects =
      await this.projectRepository.find({
        relations: [
          'members',
          'members.user',
        ],

        order: {
          createdAt: 'DESC',
        },
      });

    return projects;
  }

  async deleteProject(
    projectId: string,
    currentUser: User,
  ) {
    if (currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'Only admins can delete projects',
      );
    }

    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.projectRepository.remove(project);

    return { message: 'Project deleted successfully' };
  }
}