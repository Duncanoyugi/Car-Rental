// src/exceptions/http-exception.with-logging.ts
import { HttpException, HttpStatus } from '@nestjs/common';
import { CustomLoggerService } from '../logger/logger.service';

export class HttpExceptionWithLogging extends HttpException {
  private logger: CustomLoggerService;

  constructor(
    response: string | Record<string, any>,
    status: HttpStatus,
    logger: CustomLoggerService,
    context?: string,
    meta?: any,
  ) {
    super(response, status);
    this.logger = logger;
    
    // Log the exception when it's created
    this.logException(context, meta);
  }

  private logException(context?: string, meta?: any) {
    const status = this.getStatus();
    const message = typeof this.getResponse() === 'string' 
      ? this.getResponse() 
      : (this.getResponse() as any).message;

    const logContext = {
      statusCode: status,
      ...meta,
    };

    if (status >= 500) {
      this.logger.error(message, this.stack, context, logContext);
    } else if (status >= 400) {
      this.logger.warn(message, context, logContext);
    }
  }
}