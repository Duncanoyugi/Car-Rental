// src/seed/seed.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { User } from '../user/entities/user.entity';
import { Car } from '../car/entities/car.entity';
import { Location } from '../location/entities/location.entity';
import { Insurance } from '../insurance/entities/insurance.entity';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Car, Location, Insurance]),
    LoggerModule,
  ],
  controllers: [SeedController],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}