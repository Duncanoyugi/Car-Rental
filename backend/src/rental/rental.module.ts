import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RentalService } from './rental.service';
import { RentalController } from './rental.controller';
import { Rental } from './entities/rental.entity';
import { Car } from '../car/entities/car.entity';
import { User } from '../user/entities/user.entity'; // Changed from Customer

@Module({
  imports: [
    TypeOrmModule.forFeature([Rental, Car, User]), // Changed from Customer to User
  ],
  controllers: [RentalController],
  providers: [RentalService],
  exports: [RentalService],
})
export class RentalModule {}