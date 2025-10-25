import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { databaseConfig } from './database/database.config';
import { CarModule } from './car/car.module';
import { CustomerModule } from './customer/customer.module';
import { InsuranceModule } from './insurance/insurance.module';
import { LocationModule } from './location/location.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { PaymentModule } from './payment/payment.module';
import { RentalModule } from './rental/rental.module';
import { ReservationModule } from './reservation/reservation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig],
    }),
    DatabaseModule,
    CarModule,
    CustomerModule,
    InsuranceModule,
    LocationModule,
    MaintenanceModule,
    PaymentModule,
    RentalModule,
    ReservationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
