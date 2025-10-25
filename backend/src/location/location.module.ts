import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { Location } from './entities/location.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Location])], // Add this line
  controllers: [LocationController],
  providers: [LocationService],
  exports: [LocationService], // Export if other modules need to use location service
})
export class LocationModule {}