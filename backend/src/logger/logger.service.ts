// src/logger/logger.service.ts
import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { createLogger, format, transports, Logger } from 'winston';
import * as path from 'path';
import * as fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Interface for the context-aware logger
export interface ContextAwareLogger {
  log: (message: string, context?: string, meta?: any) => void;
  error: (message: string, trace?: string, context?: string, meta?: any) => void;
  warn: (message: string, context?: string, meta?: any) => void;
  debug: (message: string, context?: string, meta?: any) => void;
  verbose: (message: string, context?: string, meta?: any) => void;
  httpLog: (message: string, meta?: any) => void;
  performanceLog: (message: string, duration: number, meta?: any) => void;
}

@Injectable()
export class CustomLoggerService implements NestLoggerService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: format.combine(
        format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.errors({ stack: true }),
        format.json(),
      ),
      defaultMeta: { service: 'car-rental-api' },
      transports: [
        // File transport for errors
        new transports.File({
          filename: path.join('logs', 'error.log'),
          level: 'error',
          format: format.combine(
            format.timestamp(),
            format.json(),
          ),
        }),
        // File transport for all logs
        new transports.File({
          filename: path.join('logs', 'combined.log'),
          format: format.combine(
            format.timestamp(),
            format.json(),
          ),
        }),
        // Console transport for development
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple(),
          ),
        }),
      ],
    });

    // In production, use JSON format for console too
    if (process.env.NODE_ENV === 'production') {
      this.logger.add(
        new transports.Console({
          format: format.combine(
            format.timestamp(),
            format.json(),
          ),
        })
      );
    }
  }

  log(message: string, context?: string, meta?: any) {
    this.logger.info(message, { context, ...meta });
  }

  error(message: string, trace?: string, context?: string, meta?: any) {
    this.logger.error(message, { 
      context, 
      stack: trace,
      ...meta 
    });
  }

  warn(message: string, context?: string, meta?: any) {
    this.logger.warn(message, { context, ...meta });
  }

  debug(message: string, context?: string, meta?: any) {
    this.logger.debug(message, { context, ...meta });
  }

  verbose(message: string, context?: string, meta?: any) {
    this.logger.verbose(message, { context, ...meta });
  }

  // Custom methods for specific log types
  httpLog(message: string, meta?: any) {
    this.logger.info(message, { type: 'http', ...meta });
  }

  databaseLog(message: string, meta?: any) {
    this.logger.info(message, { type: 'database', ...meta });
  }

  businessLog(message: string, meta?: any) {
    this.logger.info(message, { type: 'business', ...meta });
  }

  securityLog(message: string, meta?: any) {
    this.logger.warn(message, { type: 'security', ...meta });
  }

  // Method to log with performance metrics
  performanceLog(message: string, duration: number, meta?: any) {
    this.logger.info(message, { 
      type: 'performance', 
      duration, 
      ...meta 
    });
  }

  // Method to add request context to logs - returns a context-aware logger
  withRequestContext(requestId: string, userId?: string, userRole?: string): ContextAwareLogger {
    const baseMeta = { requestId, userId, userRole };
    
    return {
      log: (message: string, context?: string, meta?: any) => 
        this.log(message, context, { ...baseMeta, ...meta }),
      error: (message: string, trace?: string, context?: string, meta?: any) => 
        this.error(message, trace, context, { ...baseMeta, ...meta }),
      warn: (message: string, context?: string, meta?: any) => 
        this.warn(message, context, { ...baseMeta, ...meta }),
      debug: (message: string, context?: string, meta?: any) => 
        this.debug(message, context, { ...baseMeta, ...meta }),
      verbose: (message: string, context?: string, meta?: any) => 
        this.verbose(message, context, { ...baseMeta, ...meta }),
      httpLog: (message: string, meta?: any) => 
        this.httpLog(message, { ...baseMeta, ...meta }),
      performanceLog: (message: string, duration: number, meta?: any) => 
        this.performanceLog(message, duration, { ...baseMeta, ...meta }),
    };
  }
}