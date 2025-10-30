// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { seedAdmin } from './scripts/seed-admin';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS if needed
  app.enableCors();
  
  // Get the DataSource from the app
  const dataSource = app.get(DataSource);
  
  // Run the admin seed script
  await seedAdmin(dataSource);
  
  const port = process.env.PORT || 3000;
  
  await app.listen(port);
  
  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`🏥 Health check endpoint: http://localhost:${port}/health/database`);
  logger.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();