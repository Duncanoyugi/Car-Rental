// src/maintenance/maintenance.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { Maintenance } from './entities/maintenance.entity';
import { Car } from '../car/entities/car.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Maintenance, Car]),
  ],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}