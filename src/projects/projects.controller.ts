import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ProjectsService } from './projects.service';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

import { CurrentUser } from '../common/decorators/current-user.decorator';

import { User } from '../users/entities/user.entity';

import { CreateProjectDto } from './dto/create-project.dto';

import { AddProjectMemberDto } from './dto/add-project-member.dto';

@Controller('api/projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
  ) {}

  @Post()
  createProject(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.projectsService.createProject(
      createProjectDto,
      currentUser,
    );
  }

  @Get()
  getProjects(@CurrentUser() currentUser: User) {
    return this.projectsService.getProjects(
      currentUser,
    );
  }

  @Post(':projectId/members')
  addMember(
    @Param('projectId') projectId: string,

    @Body()
    addProjectMemberDto: AddProjectMemberDto,

    @CurrentUser() currentUser: User,
  ) {
    return this.projectsService.addMember(
      projectId,
      addProjectMemberDto,
      currentUser,
    );
  }

  @Delete(':projectId/members/:userId')
  removeMember(
    @Param('projectId') projectId: string,

    @Param('userId') userId: string,

    @CurrentUser() currentUser: User,
  ) {
    return this.projectsService.removeMember(
      projectId,
      userId,
      currentUser,
    );
  }
}