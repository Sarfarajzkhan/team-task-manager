import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  Param,
} from '@nestjs/common';

import type { Request, Response } from 'express';

import { AuthService } from '../auth/auth.service';

import { DashboardService } from '../dashboard/dashboard.service';

import { LoginDto } from '../auth/dto/login.dto';
import { SignupDto } from '../auth/dto/signup.dto';

import { CreateProjectDto } from '../projects/dto/create-project.dto';
import { CreateTaskDto } from '../tasks/dto/create-task.dto';
import { UpdateTaskStatusDto } from '../tasks/dto/update-task-status.dto';

import { ProjectsService } from '../projects/projects.service';

import { TasksService } from '../tasks/tasks.service';

import { UsersService } from '../users/users.service';
@Controller()
export class WebController {
  constructor(
  private readonly authService: AuthService,

  private readonly dashboardService: DashboardService,

  private readonly projectsService: ProjectsService,

  private readonly tasksService: TasksService,

  private readonly usersService: UsersService,
) {}

  /*
  ===========================================
  LOGIN PAGE
  ===========================================
  */

  @Get('/login')
  loginPage(@Req() req: Request, @Res() res: Response) {
    const token = req.cookies?.token;
    if (token) {
      return res.redirect('/');
    }
    return res.render('auth/login', {
      layout: 'layouts/auth-layout',
      error: null,
    });
  }

  /*
  ===========================================
  SIGNUP PAGE
  ===========================================
  */

  @Get('/signup')
  signupPage(@Req() req: Request, @Res() res: Response) {
    const token = req.cookies?.token;
    if (token) {
      return res.redirect('/');
    }
    return res.render('auth/signup', {
      layout: 'layouts/auth-layout',
      error: null,
    });
  }

  /*
  ===========================================
  LOGIN
  ===========================================
  */

  @Post('/login')
  async login(
    @Body() body: LoginDto,
    @Res() res: Response,
  ) {
    try {
      const response =
        await this.authService.login(
          body,
        );

      res.cookie(
        'token',
        response.accessToken,
        {
          httpOnly: true,

          secure: false,

          maxAge:
            7 *
            24 *
            60 *
            60 *
            1000,
        },
      );

      return res.redirect('/');
    } catch (error) {
      return res.render('auth/login', {
        layout: 'layouts/auth-layout',
        error: error.message || 'Login failed',
      });
    }
  }

  /*
  ===========================================
  SIGNUP
  ===========================================
  */

  @Post('/signup')
  async signup(
    @Body() body: SignupDto,
    @Res() res: Response,
  ) {
    try {
      const response =
        await this.authService.signup(
          body,
        );

      res.cookie(
        'token',
        response.accessToken,
        {
          httpOnly: true,

          secure: false,

          maxAge:
            7 *
            24 *
            60 *
            60 *
            1000,
        },
      );

      return res.redirect('/');
    } catch (error) {
      return res.render('auth/signup', {
        layout: 'layouts/auth-layout',
        error: error.message || 'Signup failed',
      });
    }
  }

  /*
  ===========================================
  LOGOUT
  ===========================================
  */

  @Get('/logout')
  logout(@Res() res: Response) {
    res.clearCookie('token');

    return res.redirect('/login');
  }

  /*
  ===========================================
  DASHBOARD
  ===========================================
  */

  @Get('/')
  async dashboard(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user =
      (req as any).res.locals.user;

    if (!user) {
      return res.redirect('/login');
    }

    const dashboardData =
      await this.dashboardService.getDashboardData(
        user,
      );

    return res.render('dashboard/index', {
      title: 'Dashboard',
      dashboardData,
    });
  }

  /*
===========================================
PROJECTS PAGE
===========================================
*/

@Get('/projects')
async projectsPage(
  @Req() req: Request,

  @Res() res: Response,
) {
  const user =
    (req as any).res.locals.user;

  if (!user) {
    return res.redirect('/login');
  }

  const projects =
    await this.projectsService.getProjects(user);

  return res.render(
    'projects/index',
    {
      title: 'Projects',
      projects,
      user,
    },
  );
}

/*
===========================================
CREATE PROJECT
===========================================
*/

@Post('/projects/create')
async createProject(
  @Body() body: any,
  @Req() req: Request,
  @Res() res: Response,
) {
  const user =
    (req as any).res.locals.user;

  if (!user) {
    return res.redirect('/login');
  }

  // Only admins can create projects
  if (user.role !== 'ADMIN') {
    return res.redirect('/projects?error=Only+admins+can+create+projects');
  }

  try {
    await this.projectsService.createProject(
      body as CreateProjectDto,
      user,
    );

    return res.redirect('/projects?success=Project+created+successfully');
  } catch (error) {
    console.error('Create Project Error:', error);
    return res.redirect('/projects?error=' + encodeURIComponent(error.message));
  }
}

/*
===========================================
PROJECT DETAILS
===========================================
*/

@Get('/projects/:id')
async projectDetails(
  @Param('id') id: string,

  @Req() req: Request,

  @Res() res: Response,
) {
  const user =
    (req as any).res.locals.user;

  if (!user) {
    return res.redirect('/login');
  }

  try {
    const project =
      await this.projectsService.getProjectById(
        id,
      );

    // For admin: load all users so they can add members
    let allUsers: any[] = [];
    if (user.role === 'ADMIN') {
      const result = await this.usersService.findAll(1, 200);
      allUsers = result.users;
    }

    return res.render(
      'projects/details',
      {
        title: 'Project Details',
        project,
        user,
        allUsers,
        error: (req as any).query?.error || null,
        success: (req as any).query?.success || null,
      },
    );
  } catch (error) {
    console.error('Project Details Error:', error);
    return res.status(500).send(error.message);
  }
}

/*
===========================================
ADD MEMBER TO PROJECT
===========================================
*/

@Post('/projects/:id/add-member')
async addMemberToProject(
  @Param('id') id: string,
  @Body() body: any,
  @Req() req: Request,
  @Res() res: Response,
) {
  const user = (req as any).res.locals.user;
  if (!user) return res.redirect('/login');

  if (user.role !== 'ADMIN') {
    return res.redirect(`/projects/${id}`);
  }

  try {
    await this.projectsService.addMember(
      id,
      { userId: body.userId },
      user,
    );
    return res.redirect(`/projects/${id}?success=Member+added+successfully`);
  } catch (error) {
    return res.redirect(`/projects/${id}?error=${encodeURIComponent(error.message)}`);
  }
}

/*
===========================================
TASKS PAGE
===========================================
*/

@Get('/tasks')
async tasksPage(
  @Req() req: Request,

  @Res() res: Response,
) {
  const user =
    (req as any).res.locals.user;

  if (!user) {
    return res.redirect('/login');
  }

  const tasks =
    await this.tasksService.getTasksForFrontend(
      user,
    );

  const projects =
    await this.projectsService.getProjects(user);

  const users =
    await this.usersService.findAll(
      1,
      100,
    );

  return res.render(
    'tasks/index',
    {
      title: 'Tasks',
      tasks,
      projects,
      users: users.users,
      user,
      error: (req as any).query?.error || null,
      success: (req as any).query?.success || null,
    },
  );
}

/*
===========================================
CREATE TASK
===========================================
*/

@Post('/tasks/create')
async createTask(
  @Body() body: any,
  @Req() req: Request,
  @Res() res: Response,
) {
  const user = (req as any).res.locals.user;
  if (!user) return res.redirect('/login');

  // Only admins can create tasks
  if (user.role !== 'ADMIN') {
    return res.redirect('/tasks?error=Only+admins+can+create+tasks');
  }

  try {
    await this.tasksService.createTask(body as CreateTaskDto, user);
    return res.redirect('/tasks?success=Task+created+successfully');
  } catch (error) {
    console.error('Create Task Error:', error);
    return res.redirect('/tasks?error=' + encodeURIComponent(error.message));
  }
}

/*
===========================================
UPDATE TASK STATUS
===========================================
*/

@Post('/tasks/:id/status')
async updateTaskStatus(
  @Param('id') id: string,
  @Body() body: any,
  @Req() req: Request,
  @Res() res: Response,
) {
  const user = (req as any).res.locals.user;
  if (!user) return res.redirect('/login');

  try {
    await this.tasksService.updateTaskStatus(
      id,
      body as UpdateTaskStatusDto,
      user,
    );
    return res.redirect('/tasks?success=Status+updated');
  } catch (error) {
    console.error('Update Task Status Error:', error);
    return res.redirect('/tasks?error=' + encodeURIComponent(error.message));
  }
}

/*
===========================================
GET PROJECT MEMBERS (JSON for dynamic dropdown)
===========================================
*/

@Get('/api/web/project-members/:projectId')
async getProjectMembers(
  @Param('projectId') projectId: string,
  @Req() req: Request,
  @Res() res: Response,
) {
  const user = (req as any).res.locals.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const project = await this.projectsService.getProjectById(projectId);
    const members = project.members.map(m => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
    }));
    res.json(members);
    return;
  } catch (error) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
}

/*
===========================================
404 PAGE
===========================================
*/

@Get('*')
notFound(
  @Res() res: Response,
) {
  return res.status(404).render(
    '404',
  );
}
}