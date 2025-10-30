// src/user/users.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(role?: UserRole): Promise<Partial<User>[]> {
    const where = role ? { role } : {};
    const users = await this.userRepository.find({
      where,
      relations: ['rentals', 'reservations'],
      order: { createdAt: 'DESC' }
    });

    return users.map(user => {
      const { password, refreshToken, ...userWithoutSensitiveData } = user;
      return userWithoutSensitiveData;
    });
  }

  async findOne(id: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['rentals', 'reservations']
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const { password, refreshToken, ...userWithoutSensitiveData } = user;
    return userWithoutSensitiveData;
  }

  async findByRole(role: UserRole): Promise<Partial<User>[]> {
    const users = await this.userRepository.find({
      where: { role },
      relations: ['rentals', 'reservations']
    });

    return users.map(user => {
      const { password, refreshToken, ...userWithoutSensitiveData } = user;
      return userWithoutSensitiveData;
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUser?: User): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Regular users can only update their own profile
    if (currentUser && currentUser.id !== id && currentUser.role !== UserRole.SUPER_ADMIN && currentUser.role !== UserRole.MANAGER) {
      throw new ForbiddenException('You can only update your own profile');
    }

    // Only super admin can change roles to manager or admin
    if (updateUserDto.role && (updateUserDto.role === UserRole.MANAGER || updateUserDto.role === UserRole.SUPER_ADMIN)) {
      if (!currentUser || currentUser.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('Only super admins can assign manager or admin roles');
      }
    }

    await this.userRepository.update(id, updateUserDto);
    
    const updatedUser = await this.userRepository.findOne({ where: { id } });
    
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found after update`);
    }

    const { password, refreshToken, ...userWithoutSensitiveData } = updatedUser;
    return userWithoutSensitiveData;
  }

  async remove(id: string, currentUser?: User): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Only super admin can delete users
    if (!currentUser || currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can delete users');
    }

    await this.userRepository.remove(user);
  }

  async activateUser(id: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.isActive = true;
    await this.userRepository.save(user);

    const { password, refreshToken, ...userWithoutSensitiveData } = user;
    return userWithoutSensitiveData;
  }

  async deactivateUser(id: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.isActive = false;
    await this.userRepository.save(user);

    const { password, refreshToken, ...userWithoutSensitiveData } = user;
    return userWithoutSensitiveData;
  }
}