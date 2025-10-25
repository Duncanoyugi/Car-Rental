import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { Payment } from './entities/payment.entity';
import { Rental } from '../rental/entities/rental.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Rental]), // Add both Payment and Rental entities
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}