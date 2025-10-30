// src/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Get, Patch, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginUserDto } from '../user/dto/login-user.dto';
import { UserRole } from '../user/entities/user.entity';
import { Roles } from './decorators/roles.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register/customer')
  async registerCustomer(@Body() createUserDto: CreateUserDto) {
    // Force customer role for public registration
    createUserDto.role = UserRole.CUSTOMER;
    return this.authService.register(createUserDto);
  }

  @Public()
  @Post('register/driver')
  async registerDriver(@Body() createUserDto: CreateUserDto) {
    // Force driver role and validate license number
    createUserDto.role = UserRole.DRIVER;
    return this.authService.register(createUserDto);
  }

  @Post('register/manager')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async registerManager(@Body() createUserDto: CreateUserDto, @CurrentUser() user: any) {
    // Only admins can create managers
    createUserDto.role = UserRole.MANAGER;
    return this.authService.register(createUserDto, user);
  }

  @Post('register/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async registerAdmin(@Body() createUserDto: CreateUserDto, @CurrentUser() user: any) {
    // Only existing admins can create new admins
    createUserDto.role = UserRole.SUPER_ADMIN;
    return this.authService.register(createUserDto, user);
  }

  @Public()
  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() refreshTokenDto: { refreshToken: string }) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: any) {
    return this.authService.getProfile(user.id);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@CurrentUser() user: any) {
    return this.authService.logout(user.id);
  }

  @Patch('promote-to-manager/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async promoteToManager(@Param('userId') userId: string, @CurrentUser() user: any) {
    return this.authService.promoteToManager(userId, user);
  }
}