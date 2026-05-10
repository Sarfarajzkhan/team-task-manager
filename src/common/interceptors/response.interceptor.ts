import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor
  implements NestInterceptor
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        // Skip interceptor for SSR routes that already sent a response
        // (render, redirect, or any response already flushed)
        if (response.headersSent) {
          return data;
        }

        // Only wrap plain object/data API responses
        if (
          data === undefined ||
          data === null ||
          typeof data === 'string'
        ) {
          return data;
        }

        return {
          success: true,
          timestamp: new Date().toISOString(),
          data,
        };
      }),
    );
  }
}