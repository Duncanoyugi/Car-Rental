// src/location/location.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../user/entities/user.entity';

@Controller('location')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  create(@Body() createLocationDto: CreateLocationDto) {
    return this.locationService.create(createLocationDto);
  }

  @Get()
  @Public() // Everyone can view locations
  findAll() {
    return this.locationService.findAll();
  }

  @Get('active')
  @Public() // Everyone can view active locations
  findActiveLocations() {
    return this.locationService.findActiveLocations();
  }

  @Get('search')
  @Public() // Everyone can search locations
  searchLocations(@Query('q') searchTerm: string) {
    if (!searchTerm) {
      return this.locationService.findAll();
    }
    return this.locationService.searchLocations(searchTerm);
  }

  @Get('name/:name')
  @Public() // Everyone can search by name
  findByName(@Param('name') name: string) {
    return this.locationService.findByName(name);
  }

  @Get('address/:address')
  @Public() // Everyone can search by address
  findByAddress(@Param('address') address: string) {
    return this.locationService.findByAddress(address);
  }

  @Get('proximity')
  @Public() // Everyone can search by proximity
  getLocationsByProximity(
    @Query('lat', new DefaultValuePipe(0), ParseIntPipe) latitude: number,
    @Query('lng', new DefaultValuePipe(0), ParseIntPipe) longitude: number,
    @Query('radius', new DefaultValuePipe(10), ParseIntPipe) radiusKm: number
  ) {
    return this.locationService.getLocationsByProximity(latitude, longitude, radiusKm);
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  getLocationStats() {
    return this.locationService.getLocationStats();
  }

  @Get('validate/:id')
  @Public() // Allow validation for any user
  validateLocationExists(@Param('id') id: string) {
    return this.locationService.validateLocationExists(+id);
  }

  @Get(':id')
  @Public() // Everyone can view individual location details
  findOne(@Param('id') id: string) {
    return this.locationService.findOne(+id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  update(@Param('id') id: string, @Body() updateLocationDto: UpdateLocationDto) {
    return this.locationService.update(+id, updateLocationDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.locationService.remove(+id);
  }
}