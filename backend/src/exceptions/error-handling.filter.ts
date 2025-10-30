import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CustomLoggerService } from '../logger/logger.service';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string;
  error?: string;
  requestId?: string;
  stack?: string;
}

@Catch()
export class GlobalErrorFilter implements ExceptionFilter {
  constructor(private readonly logger: CustomLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const requestId = request.headers['x-request-id'] as string || 
                     this.generateRequestId();
    
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: this.getMessage(exception),
      requestId,
    };

    // Add error name for HttpExceptions
    if (exception instanceof HttpException) {
      errorResponse.error = exception.name;
    }

    // Log the error with appropriate level
    this.logError(exception, request, requestId, status);

    // Don't send stack trace in production
    if (process.env.NODE_ENV !== 'production') {
      errorResponse.stack = this.getStackTrace(exception);
    }

    response.status(status).json(errorResponse);
  }

  private getMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return response;
      } else if (typeof response === 'object' && response !== null) {
        return (response as any).message || exception.message;
      }
    } else if (exception instanceof Error) {
      return exception.message;
    }
    return 'Internal server error';
  }

  private getStackTrace(exception: unknown): string | undefined {
    if (exception instanceof Error) {
      return exception.stack;
    }
    return undefined;
  }

  private logError(
    exception: unknown, 
    request: Request, 
    requestId: string, 
    status: number
  ) {
    const user = (request as any).user;
    const userId = user?.id;
    const userRole = user?.role;

    const logContext = {
      requestId,
      userId,
      userRole,
      ip: request.ip,
      userAgent: request.get('user-agent'),
      body: this.sanitizeBody(request.body),
      query: request.query,
      params: request.params,
    };

    const loggerWithContext = this.logger.withRequestContext(
      requestId, 
      userId, 
      userRole
    );

    if (status >= 500) {
      // Server errors
      loggerWithContext.error(
        `HTTP ${status} - ${request.method} ${request.url}`,
        this.getStackTrace(exception),
        'GlobalErrorFilter',
        logContext
      );
    } else if (status >= 400) {
      // Client errors
      loggerWithContext.warn(
        `HTTP ${status} - ${request.method} ${request.url}`,
        'GlobalErrorFilter',
        {
          ...logContext,
          errorMessage: this.getMessage(exception),
        }
      );
    } else {
      // Other errors
      loggerWithContext.error(
        `Unexpected error - ${request.method} ${request.url}`,
        this.getStackTrace(exception),
        'GlobalErrorFilter',
        logContext
      );
    }
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
    ];

    const sanitized = { ...body };
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });

    return sanitized;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}