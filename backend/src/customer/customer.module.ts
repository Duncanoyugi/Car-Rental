import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerService } from './customer.service'; // Fixed service name
import { CustomerController } from './customer.controller';
import { Customer } from './entities/customer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Customer])], // Add this line
  controllers: [CustomerController],
  providers: [CustomerService], // Fixed: should be CustomerService (singular)
})
export class CustomerModule {}