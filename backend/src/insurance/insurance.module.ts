// src/insurance/insurance.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InsuranceService } from './insurance.service';
import { InsuranceController } from './insurance.controller';
import { Insurance } from './entities/insurance.entity';
import { Car } from '../car/entities/car.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Insurance, Car]),
  ],
  controllers: [InsuranceController],
  providers: [InsuranceService],
  exports: [InsuranceService],
})
export class InsuranceModule {}