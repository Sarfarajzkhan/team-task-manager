import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly notificationsService: NotificationsService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.token;

    if (!token) {
      res.locals.user = null;
      res.locals.unreadCount = 0;
      return next();
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET!,
      ) as jwt.JwtPayload;

      const user = {
        ...decoded,
        id: decoded.sub,
      } as any;

      res.locals.user = user;
      
      // Fetch unread count
      res.locals.unreadCount = await this.notificationsService.getUnreadCount(user);

      next();
    } catch (error) {
      res.locals.user = null;
      res.locals.unreadCount = 0;
      next();
    }
  }
}