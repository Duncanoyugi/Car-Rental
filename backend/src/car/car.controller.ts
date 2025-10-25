import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { CarService } from './car.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';

@Controller('cars')
export class CarController {
  constructor(private readonly carService: CarService) {}

  @Post()
  create(@Body() dto: CreateCarDto) {
    return this.carService.create(dto);
  }

  @Get()
  findAll() {
    return this.carService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // Convert string ID to number to match service expectation
    return this.carService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCarDto) {
    // Convert string ID to number to match service expectation
    return this.carService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    // Convert string ID to number to match service expectation
    return this.carService.remove(+id);
  }
}