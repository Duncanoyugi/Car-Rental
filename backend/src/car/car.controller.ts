// src/car/car.controller.ts
import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Query, ParseBoolPipe, DefaultValuePipe } from '@nestjs/common';
import { CarService } from './car.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../user/entities/user.entity';

@Controller('cars')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CarController {
  constructor(private readonly carService: CarService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  create(@Body() createCarDto: CreateCarDto) {
    return this.carService.create(createCarDto);
  }

  @Get()
  @Public() // Everyone can view cars
  findAll(
    @Query('available', new DefaultValuePipe(false), ParseBoolPipe) available: boolean
  ) {
    return this.carService.findAll(available);
  }

  @Get('available')
  @Public() // Everyone can view available cars
  findAvailable() {
    return this.carService.findAvailable();
  }

  @Get('search')
  @Public() // Everyone can search cars
  searchCars(
    @Query('manufacturer') manufacturer?: string,
    @Query('minYear') minYear?: number,
    @Query('maxYear') maxYear?: number,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('color') color?: string,
    @Query('availableOnly', new DefaultValuePipe(true), ParseBoolPipe) availableOnly?: boolean
  ) {
    return this.carService.searchCars({
      manufacturer,
      minYear: minYear ? Number(minYear) : undefined,
      maxYear: maxYear ? Number(maxYear) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      color,
      availableOnly
    });
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  getCarStats() {
    return this.carService.getCarStats();
  }

  @Get('manufacturer/:manufacturer')
  @Public() // Everyone can view cars by manufacturer
  findByManufacturer(@Param('manufacturer') manufacturer: string) {
    return this.carService.findByManufacturer(manufacturer);
  }

  @Get(':id')
  @Public() // Everyone can view individual car details
  findOne(@Param('id') id: string) {
    return this.carService.findOne(+id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  update(@Param('id') id: string, @Body() updateCarDto: UpdateCarDto) {
    return this.carService.update(+id, updateCarDto);
  }

  @Patch(':id/availability')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  updateAvailability(
    @Param('id') id: string,
    @Body('isAvailable') isAvailable: boolean
  ) {
    return this.carService.updateAvailability(+id, isAvailable);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.carService.remove(+id);
  }
}