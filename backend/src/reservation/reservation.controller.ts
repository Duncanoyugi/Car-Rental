// src/reservation/reservation.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { CreateReservationDto, ReservationStatus } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../user/entities/user.entity';

@Controller('reservation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  create(@Body() createReservationDto: CreateReservationDto, @CurrentUser() user: any) {
    // Auto-set the userId from the authenticated user
    createReservationDto.userId = user.id;
    return this.reservationService.create(createReservationDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  findAll() {
    return this.reservationService.findAll();
  }

  @Get('my-reservations')
  @Roles(UserRole.CUSTOMER)
  findMyReservations(@CurrentUser() user: any) {
    return this.reservationService.findByUserId(user.id, user);
  }

  @Get('upcoming')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  getUpcomingReservations(@Query('days', new ParseIntPipe({ optional: true })) days?: number) {
    return this.reservationService.getUpcomingReservations(days || 7);
  }

  @Get('expiring')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  getExpiringReservations(@Query('hours', new ParseIntPipe({ optional: true })) hours?: number) {
    return this.reservationService.getExpiringReservations(hours || 24);
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  getReservationStats() {
    return this.reservationService.getReservationStats();
  }

  @Get('car/:carId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  findByCarId(@Param('carId') carId: string) {
    return this.reservationService.findByCarId(+carId);
  }

  @Get('status/:status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.CUSTOMER)
  findByStatus(@Param('status') status: ReservationStatus) {
    return this.reservationService.findByStatus(status);
  }

  @Get('user/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  findByUserId(@Param('userId') userId: string, @CurrentUser() user: any) {
    return this.reservationService.findByUserId(userId, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reservationService.findOne(+id, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReservationDto: UpdateReservationDto, @CurrentUser() user: any) {
    return this.reservationService.update(+id, updateReservationDto, user);
  }

  @Patch(':id/confirm')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  confirmReservation(@Param('id') id: string) {
    return this.reservationService.confirmReservation(+id);
  }

  @Patch(':id/cancel')
  cancelReservation(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reservationService.cancelReservation(+id, user);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ReservationStatus
  ) {
    return this.reservationService.updateStatus(+id, status);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reservationService.remove(+id, user);
  }

  @Get('availability/check')
  @Roles(UserRole.CUSTOMER, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  checkAvailability(
    @Query('carId') carId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reservationService.checkCarAvailability(+carId, startDate, endDate);
  }
}