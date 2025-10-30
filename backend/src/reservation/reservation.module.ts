import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationService } from './reservation.service';
import { ReservationController } from './reservation.controller';
import { Reservation } from './entities/reservation.entity';
import { Car } from '../car/entities/car.entity';
import { User } from '../user/entities/user.entity'; // Changed from Customer

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, Car, User]), // Changed from Customer to User
  ],
  controllers: [ReservationController],
  providers: [ReservationService],
  exports: [ReservationService],
})
export class ReservationModule {}