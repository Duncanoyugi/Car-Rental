// src/user/user.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './user.service'; // Fixed import name
import { UserController } from './user.controller';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UsersService], // Fixed service name
  exports: [UsersService], // Export if needed by other modules
})
export class UserModule {}