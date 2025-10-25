import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InsuranceService } from './insurance.service';
import { InsuranceController } from './insurance.controller';
import { Insurance } from './entities/insurance.entity';
import { Car } from '../car/entities/car.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Insurance, Car]), // Add both Insurance and Car entities
  ],
  controllers: [InsuranceController],
  providers: [InsuranceService],
  exports: [InsuranceService], // Export if other modules need to use insurance service
})
export class InsuranceModule {}