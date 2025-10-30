import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { UsersService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  findAll(@Query('role') role?: UserRole) {
    return this.usersService.findAll(role);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @CurrentUser() user: any) {
    return this.usersService.update(id, updateUserDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.remove(id, user);
  }

  @Get('role/drivers')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  findDrivers() {
    return this.usersService.findByRole(UserRole.DRIVER);
  }

  @Get('role/managers')
  @Roles(UserRole.SUPER_ADMIN)
  findManagers() {
    return this.usersService.findByRole(UserRole.MANAGER);
  }

  @Patch(':id/activate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  activateUser(@Param('id') id: string) {
    return this.usersService.activateUser(id);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  deactivateUser(@Param('id') id: string) {
    return this.usersService.deactivateUser(id);
  }
}