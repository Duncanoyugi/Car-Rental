import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { databaseConfig } from './database/database.config';
import { CarModule } from './car/car.module';
import { InsuranceModule } from './insurance/insurance.module';
import { LocationModule } from './location/location.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { PaymentModule } from './payment/payment.module';
import { RentalModule } from './rental/rental.module';
import { ReservationModule } from './reservation/reservation.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig],
    }),
    DatabaseModule,
    CarModule,
    InsuranceModule,
    LocationModule,
    MaintenanceModule,
    PaymentModule,
    RentalModule,
    ReservationModule,
    UserModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}