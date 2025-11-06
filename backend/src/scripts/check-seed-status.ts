// // src/scripts/check-seed-status.ts
// import { NestFactory } from '@nestjs/core';
// import { AppModule } from '../app.module';
// import { SeedService } from '../seed/seed.service';
// import { CustomLoggerService } from '../logger/logger.service';

// async function checkSeedStatus() {
//   const app = await NestFactory.createApplicationContext(AppModule);
//   const logger = app.get(CustomLoggerService);
//   const seedService = app.get(SeedService);

//   try {
//     logger.log('Checking seed status...', 'SeedStatus');
    
//     const status = await seedService.getSeedStatus();
    
//     console.log('📊 Database Seed Status:');
//     console.log('========================');
//     console.log(`👥 Users: ${status.tables.users}`);
//     console.log(`🚗 Cars: ${status.tables.cars}`);
//     console.log(`📍 Locations: ${status.tables.locations}`);
//     console.log(`🛡️  Insurance: ${status.tables.insurance}`);
//     console.log('========================');
    
//     process.exit(0);
//   } catch (error) {
//     logger.error('Failed to check seed status', error.stack, 'SeedStatus');
//     process.exit(1);
//   }
// }

// checkSeedStatus();