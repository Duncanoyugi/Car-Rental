// src/main.ts
import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { seedAdmin } from './scripts/seed-admin';
import { GlobalErrorFilter } from './exceptions/error-handling.filter';
import { CustomLoggerService } from './logger/logger.service';

async function bootstrap() {
  // Create app with custom logger
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Buffer logs until custom logger is ready
  });

  // Use custom logger
  const logger = app.get(CustomLoggerService);
  app.useLogger(logger);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: false,
    }),
  );

  // Global error filter
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new GlobalErrorFilter(logger));

  // Enable CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:4200'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Get the DataSource from the app
  const dataSource = app.get(DataSource);
  
  // Run the admin seed script
  try {
    await seedAdmin(dataSource);
    logger.log('Admin user seeded successfully', 'Bootstrap');
  } catch (error) {
    logger.error('Failed to seed admin user', error.stack, 'Bootstrap');
  }

  const port = process.env.PORT || 3000;
  
  await app.listen(port);
  
  logger.log(`🚀 Application is running on: http://localhost:${port}`, 'Bootstrap');
  logger.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`, 'Bootstrap');
  logger.log(`🔐 Auth endpoints available at: http://localhost:${port}/api/v1/auth`, 'Bootstrap');
  logger.log(`🚗 Car endpoints available at: http://localhost:${port}/api/v1/cars`, 'Bootstrap');
}

bootstrap().catch(error => {
  console.error('Failed to start application:', error);
  process.exit(1);
});