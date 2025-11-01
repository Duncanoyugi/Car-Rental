// src/seed/seed.controller.ts
import { Controller, Post, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SeedService } from './seed.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { Public } from '../auth/decorators/public.decorator';

@Controller('seed')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async seedData() {
    return await this.seedService.seedAll();
  }

  @Get('status')
  @Public()
  async getSeedStatus() {
    return await this.seedService.getSeedStatus();
  }

  @Post('reset')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async resetData() {
    // This would be a more destructive operation - use with caution
    return { message: 'Reset endpoint - implement with caution' };
  }
}