// src/payment/payment.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

@Controller('payment')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @Roles(UserRole.CUSTOMER, UserRole.DRIVER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.create(createPaymentDto);
  }

  @Get()
  @Roles(UserRole.MANAGER, UserRole.SUPER_ADMIN)
  findAll() {
    return this.paymentService.findAll();
  }

  @Get('rental/:rentalId')
  @Roles(UserRole.CUSTOMER, UserRole.DRIVER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  findByRentalId(@Param('rentalId') rentalId: string) {
    return this.paymentService.findByRentalId(+rentalId);
  }

  @Get('method/:paymentMethod')
  @Roles(UserRole.MANAGER, UserRole.SUPER_ADMIN)
  findByPaymentMethod(@Param('paymentMethod') paymentMethod: string) {
    return this.paymentService.findByPaymentMethod(paymentMethod);
  }

  @Get('range')
  @Roles(UserRole.MANAGER, UserRole.SUPER_ADMIN)
  getPaymentsByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.paymentService.getPaymentsByDateRange(startDate, endDate);
  }

  @Get('revenue/total')
  @Roles(UserRole.MANAGER, UserRole.SUPER_ADMIN)
  getTotalRevenue() {
    return this.paymentService.getTotalRevenue();
  }

  @Get('revenue/range')
  @Roles(UserRole.MANAGER, UserRole.SUPER_ADMIN)
  getRevenueByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.paymentService.getRevenueByDateRange(startDate, endDate);
  }

  @Get('methods/summary')
  @Roles(UserRole.MANAGER, UserRole.SUPER_ADMIN)
  getPaymentMethodsSummary() {
    return this.paymentService.getPaymentMethodsSummary();
  }

  @Get(':id')
  @Roles(UserRole.CUSTOMER, UserRole.DRIVER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.paymentService.findOne(+id);
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER, UserRole.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentService.update(+id, updatePaymentDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.paymentService.remove(+id);
  }
}