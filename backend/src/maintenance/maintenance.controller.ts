// src/maintenance/maintenance.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto, MaintenanceStatus, MaintenanceType } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

@Controller('maintenance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  create(@Body() createMaintenanceDto: CreateMaintenanceDto) {
    return this.maintenanceService.create(createMaintenanceDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.DRIVER)
  findAll() {
    return this.maintenanceService.findAll();
  }

  @Get('active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.DRIVER)
  findActiveMaintenance() {
    return this.maintenanceService.findActiveMaintenance();
  }

  @Get('upcoming')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.DRIVER)
  getUpcomingMaintenance(@Query('days', new ParseIntPipe({ optional: true })) days?: number) {
    return this.maintenanceService.getUpcomingMaintenance(days || 7);
  }

  @Get('overdue')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  getOverdueMaintenance() {
    return this.maintenanceService.getOverdueMaintenance();
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  getMaintenanceStats() {
    return this.maintenanceService.getMaintenanceStats();
  }

  @Get('by-type')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  getMaintenanceByType() {
    return this.maintenanceService.getMaintenanceByType();
  }

  @Get('car/:carId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.DRIVER)
  findByCarId(@Param('carId') carId: string) {
    return this.maintenanceService.findByCarId(+carId);
  }

  @Get('status/:status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.DRIVER)
  findByStatus(@Param('status') status: MaintenanceStatus) {
    return this.maintenanceService.findByStatus(status);
  }

  @Get('cost/car/:carId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  getMaintenanceCostByCar(@Param('carId') carId: string) {
    return this.maintenanceService.getMaintenanceCostByCar(+carId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.DRIVER)
  findOne(@Param('id') id: string) {
    return this.maintenanceService.findOne(+id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  update(@Param('id') id: string, @Body() updateMaintenanceDto: UpdateMaintenanceDto) {
    return this.maintenanceService.update(+id, updateMaintenanceDto);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: MaintenanceStatus
  ) {
    return this.maintenanceService.updateStatus(+id, status);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.maintenanceService.remove(+id);
  }
}