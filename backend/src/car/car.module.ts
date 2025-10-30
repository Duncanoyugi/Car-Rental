// src/car/car.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarService } from './car.service';
import { CarController } from './car.controller';
import { Car } from './entities/car.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Car])],
  controllers: [CarController],
  providers: [CarService],
  exports: [CarService], // Export if needed by other modules
})
export class CarModule {}