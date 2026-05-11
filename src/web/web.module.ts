import {
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';

import { WebController } from './web.controller';

import { WebService } from './web.service';

import { AuthMiddleware } from '../common/middleware/auth.middleware';

import { AuthModule } from '../auth/auth.module';

import { DashboardModule } from '../dashboard/dashboard.module';

import { ProjectsModule } from '../projects/projects.module';

import { TasksModule } from '../tasks/tasks.module';

import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    AuthModule,
    DashboardModule,
    ProjectsModule,
    TasksModule,
    UsersModule,
    NotificationsModule,
  ],

  controllers: [WebController],

  providers: [WebService],
})
export class WebModule
  implements NestModule
{
  configure(
    consumer: MiddlewareConsumer,
  ) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes('*');
  }
}