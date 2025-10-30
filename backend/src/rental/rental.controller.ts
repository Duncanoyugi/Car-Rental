// src/rental/rental.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { RentalService } from './rental.service';
import { CreateRentalDto, RentalStatus } from './dto/create-rental.dto';
import { UpdateRentalDto } from './dto/update-rental.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../user/entities/user.entity';

@Controller('rental')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RentalController {
  constructor(private readonly rentalService: RentalService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  create(@Body() createRentalDto: CreateRentalDto, @CurrentUser() user: any) {
    // Auto-set the userId from the authenticated user
    createRentalDto.userId = user.id;
    return this.rentalService.create(createRentalDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  findAll() {
    return this.rentalService.findAll();
  }

  @Get('my-rentals')
  @Roles(UserRole.CUSTOMER)
  findMyRentals(@CurrentUser() user: any) {
    return this.rentalService.findByUserId(user.id, user);
  }

  @Get('active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.DRIVER)
  getActiveRentals() {
    return this.rentalService.getActiveRentals();
  }

  @Get('overdue')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  getOverdueRentals() {
    return this.rentalService.getOverdueRentals();
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  getRentalStats() {
    return this.rentalService.getRentalStats();
  }

  @Get('car/:carId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  findByCarId(@Param('carId') carId: string) {
    return this.rentalService.findByCarId(+carId);
  }

  @Get('status/:status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.CUSTOMER)
  findByStatus(@Param('status') status: RentalStatus) {
    return this.rentalService.findByStatus(status);
  }

  @Get('user/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  findByUserId(@Param('userId') userId: string, @CurrentUser() user: any) {
    return this.rentalService.findByUserId(userId, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.rentalService.findOne(+id, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRentalDto: UpdateRentalDto, @CurrentUser() user: any) {
    return this.rentalService.update(+id, updateRentalDto, user);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: RentalStatus
  ) {
    return this.rentalService.updateStatus(+id, status);
  }

  @Patch(':id/extend')
  extendRental(
    @Param('id') id: string,
    @Body('newEndDate') newEndDate: string,
    @CurrentUser() user: any
  ) {
    return this.rentalService.extendRental(+id, newEndDate, user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.rentalService.remove(+id, user);
  }

  @Get('availability/check')
  @Roles(UserRole.CUSTOMER, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  checkAvailability(
    @Query('carId') carId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.rentalService.checkCarAvailability(+carId, startDate, endDate);
  }
}