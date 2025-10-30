// src/interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CustomLoggerService, ContextAwareLogger } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: CustomLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;
    const user = request.user;
    const requestId = request.headers['x-request-id'] as string || 
                     `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add requestId to request object for use in other parts of the app
    request.requestId = requestId;

    const startTime = Date.now();

    const loggerWithContext: ContextAwareLogger = this.logger.withRequestContext(
      requestId,
      user?.id,
      user?.role
    );

    // Log request
    loggerWithContext.httpLog(`Incoming Request - ${method} ${url}`, {
      method,
      url,
      body: this.sanitizeBody(body),
      query,
      params,
      ip: request.ip,
      userAgent: request.get('user-agent'),
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          loggerWithContext.httpLog(`Outgoing Response - ${method} ${url}`, {
            statusCode: 200,
            duration: `${duration}ms`,
            responseSize: this.getResponseSize(data),
          });

          // Log performance if request took too long
          if (duration > 1000) {
            loggerWithContext.performanceLog(
              `Slow request detected - ${method} ${url}`,
              duration,
              { threshold: 1000 }
            );
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          loggerWithContext.httpLog(`Request Failed - ${method} ${url}`, {
            statusCode: error.status || 500,
            duration: `${duration}ms`,
            error: error.message,
          });
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    const sensitiveFields = [
      'password',
      'token',
      'refreshToken',
      'authorization',
      'creditCard',
      'cvv',
      'ssn',
      'secret',
      'currentPassword',
      'newPassword',
    ];

    const sanitized = { ...body };
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });

    return sanitized;
  }

  private getResponseSize(data: any): string {
    try {
      const size = Buffer.byteLength(JSON.stringify(data), 'utf8');
      return `${(size / 1024).toFixed(2)} KB`;
    } catch {
      return 'unknown';
    }
  }
}