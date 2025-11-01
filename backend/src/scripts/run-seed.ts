// src/scripts/run-seed.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedService } from '../seed/seed.service';
import { CustomLoggerService } from '../logger/logger.service';

async function runSeed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const logger = app.get(CustomLoggerService);
  const seedService = app.get(SeedService);

  try {
    logger.log('Starting database seeding...', 'SeedCLI');
    
    console.log('🌱 Starting database seeding...');
    console.log('==============================');
    
    const result = await seedService.seedAll();
    
    console.log('✅ Seeding completed successfully!');
    console.log('📊 Results:');
    console.log(`   👥 Users: ${result.results.users.count} created`);
    console.log(`   🚗 Cars: ${result.results.cars.count} created`);
    console.log(`   📍 Locations: ${result.results.locations.count} created`);
    console.log(`   🛡️  Insurance: ${result.results.insurance.count} created`);
    console.log('==============================');
    
    logger.log('Database seeding completed successfully', 'SeedCLI', { result });
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    logger.error('Database seeding failed', error.stack, 'SeedCLI');
    process.exit(1);
  }
}

runSeed();