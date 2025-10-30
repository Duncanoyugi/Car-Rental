// src/insurance/insurance.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { InsuranceService } from './insurance.service';
import { CreateInsuranceDto } from './dto/create-insurance.dto';
import { UpdateInsuranceDto } from './dto/update-insurance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../user/entities/user.entity';

@Controller('insurance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  create(@Body() createInsuranceDto: CreateInsuranceDto) {
    return this.insuranceService.create(createInsuranceDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  findAll() {
    return this.insuranceService.findAll();
  }

  @Get('active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  findActiveInsurances() {
    return this.insuranceService.findActiveInsurances();
  }

  @Get('expiring')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  getExpiringInsurances(@Query('days', new ParseIntPipe({ optional: true })) days?: number) {
    return this.insuranceService.getExpiringInsurances(days || 30);
  }

  @Get('expired')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  getExpiredInsurances() {
    return this.insuranceService.getExpiredInsurances();
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  getInsuranceStats() {
    return this.insuranceService.getInsuranceStats();
  }

  @Get('car/:carId')
  @Public() // Allow checking insurance status for any car
  findByCarId(@Param('carId') carId: string) {
    return this.insuranceService.findByCarId(+carId);
  }

  @Get('check-validity/:carId')
  @Public() // Allow checking insurance validity for any car
  checkInsuranceValidity(@Param('carId') carId: string) {
    return this.insuranceService.isInsuranceValid(+carId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  findOne(@Param('id') id: string) {
    return this.insuranceService.findOne(+id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  update(@Param('id') id: string, @Body() updateInsuranceDto: UpdateInsuranceDto) {
    return this.insuranceService.update(+id, updateInsuranceDto);
  }

  @Patch(':id/renew')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  renewInsurance(
    @Param('id') id: string,
    @Body('newEndDate') newEndDate: string
  ) {
    return this.insuranceService.renewInsurance(+id, newEndDate);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.insuranceService.remove(+id);
  }
}