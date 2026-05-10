import {
  Injectable,
  NestMiddleware,
} from '@nestjs/common';

import { Request, Response, NextFunction } from 'express';

import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthMiddleware
  implements NestMiddleware
{
  use(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const token = req.cookies?.token;

    if (!token) {
      res.locals.user = null;

      return next();
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET!,
      );

      res.locals.user = decoded;

      next();
    } catch (error) {
      res.locals.user = null;

      next();
    }
  }
}