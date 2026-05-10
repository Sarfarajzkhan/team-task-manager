import {
  Body,
  Controller,
  Get,
  Post,
  Render,
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
  @Render('auth/login')
  loginPage(@Req() req: Request) {
    const token = req.cookies?.token;

    if (token) {
      return {
        redirect: '/',
      };
    }

    return {};
  }

  /*
  ===========================================
  SIGNUP PAGE
  ===========================================
  */

  @Get('/signup')
  @Render('auth/signup')
  signupPage(@Req() req: Request) {
    const token = req.cookies?.token;

    if (token) {
      return {
        redirect: '/',
      };
    }

    return {};
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
  @Body() body: CreateProjectDto,

  @Req() req: Request,

  @Res() res: Response,
) {
  const user =
    (req as any).res.locals.user;

  if (!user) {
    return res.redirect('/login');
  }

  try {
    await this.projectsService.createProject(
      body,
      user,
    );

    return res.redirect('/projects');
  } catch (error) {
    console.log(error);

    return res.redirect('/projects');
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

    return res.render(
      'projects/details',
      {
        title: 'Project Details',

        project,
      },
    );
  } catch (error) {
    console.error('Project Details Error:', error);
    return res.status(500).send(error.message);
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
  @Body() body: CreateTaskDto,

  @Req() req: Request,

  @Res() res: Response,
) {
  const user =
    (req as any).res.locals.user;

  if (!user) {
    return res.redirect('/login');
  }

  try {
    await this.tasksService.createTask(
      body,
      user,
    );

    return res.redirect('/tasks');
  } catch (error) {
    console.log(error);

    return res.redirect('/tasks');
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

  @Body() body: UpdateTaskStatusDto,

  @Req() req: Request,

  @Res() res: Response,
) {
  const user =
    (req as any).res.locals.user;

  if (!user) {
    return res.redirect('/login');
  }

  try {
    await this.tasksService.updateTaskStatus(
      id,
      body,
      user,
    );

    return res.redirect('/tasks');
  } catch (error) {
    console.log(error);

    return res.redirect('/tasks');
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