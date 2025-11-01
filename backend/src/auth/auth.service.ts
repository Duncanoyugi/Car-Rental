// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../user/entities/user.entity';
import { UserRole } from '../user/entities/user.entity';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginUserDto } from '../user/dto/login-user.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto, currentUser?: User): Promise<{ user: Partial<User>; accessToken: string; refreshToken: string }> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email }
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Provide default role if not specified and validate role permissions
    const role = createUserDto.role || UserRole.CUSTOMER;
    await this.validateRoleCreation(role, currentUser);

    // Validate driver registration
    if (role === UserRole.DRIVER && !createUserDto.licenseNumber) {
      throw new BadRequestException('License number is required for drivers');
    }

    // Create user with ensured role
    const user = this.userRepository.create({
      ...createUserDto,
      role // Ensure role is always set
    });
    await this.userRepository.save(user);

    // Generate tokens
    const tokens = await this.generateTokens(user);
    
    // Update user with refresh token
    await this.userRepository.update(user.id, { refreshToken: tokens.refreshToken });

    // Remove sensitive data from response
    const { password, refreshToken, ...userWithoutSensitiveData } = user;

    return {
      user: userWithoutSensitiveData,
      ...tokens
    };
  }

  async login(loginUserDto: LoginUserDto): Promise<{ user: Partial<User>; accessToken: string; refreshToken: string }> {
    this.logger.debug(`Login attempt for email: ${loginUserDto.email}`);
    
    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: loginUserDto.email }
    });

    this.logger.debug(`User found: ${user ? 'Yes' : 'No'}`);
    
    if (!user) {
      this.logger.warn(`Login failed: No user found with email ${loginUserDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.debug(`User details - ID: ${user.id}, Role: ${user.role}, Active: ${user.isActive}`);

    // Check if user is active
    if (!user.isActive) {
      this.logger.warn(`Login failed: Account deactivated for user ${user.email}`);
      throw new UnauthorizedException('Account is deactivated');
    }

    // Validate password
    this.logger.debug('Validating password...');
    const isPasswordValid = await user.validatePassword(loginUserDto.password);
    this.logger.debug(`Password validation result: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
      this.logger.warn(`Login failed: Invalid password for user ${user.email}`);
      
      // Additional debug: Check if it's a bcrypt issue
      try {
        // Test if bcrypt.compare works at all
        const testCompare = await bcrypt.compare('test', user.password);
        this.logger.debug(`Bcrypt test comparison worked: ${testCompare}`);
      } catch (bcryptError) {
        this.logger.error(`Bcrypt comparison error: ${bcryptError.message}`);
      }
      
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.debug(`Login successful for user: ${user.email}`);

    // Generate tokens
    const tokens = await this.generateTokens(user);
    
    // Update user with refresh token
    await this.userRepository.update(user.id, { refreshToken: tokens.refreshToken });

    // Remove sensitive data from response
    const { password, refreshToken, ...userWithoutSensitiveData } = user;

    return {
      user: userWithoutSensitiveData,
      ...tokens
    };
  }

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refreshsecretkey'
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub, refreshToken }
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user);
      
      // Update refresh token
      await this.userRepository.update(user.id, { refreshToken: tokens.refreshToken });

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    // Fix: Use null as string for SQL Server compatibility
    await this.userRepository.update(userId, { refreshToken: null as any });
  }

  async getProfile(userId: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['rentals', 'reservations']
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password, refreshToken, ...userWithoutSensitiveData } = user;
    return userWithoutSensitiveData;
  }

  async promoteToManager(userId: string, currentUser: User): Promise<Partial<User>> {
    // Only super admin can promote to manager
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can promote users to manager');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.role = UserRole.MANAGER;
    await this.userRepository.save(user);

    const { password, refreshToken, ...userWithoutSensitiveData } = user;
    return userWithoutSensitiveData;
  }

  // TEMPORARY: Add debug method to check all users
  async debugAllUsers(): Promise<any[]> {
    const users = await this.userRepository.find();
    return users.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      passwordLength: user.password ? user.password.length : 0,
      createdAt: user.createdAt
    }));
  }

  private async validateRoleCreation(role: UserRole, currentUser?: User): Promise<void> {
    // Public registration allowed only for customer and driver
    if (!currentUser && (role === UserRole.CUSTOMER || role === UserRole.DRIVER)) {
      return;
    }

    // If user is authenticated, check permissions
    if (currentUser) {
      // Only super admin can create managers and admins
      if ((role === UserRole.MANAGER || role === UserRole.SUPER_ADMIN) && currentUser.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('Only super admins can create managers and admins');
      }
    } else {
      // Unauthenticated users cannot create managers or admins
      if (role === UserRole.MANAGER || role === UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('Unauthorized to create this user role');
      }
    }
  }

  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'supersecretkey',
      expiresIn: '15m'
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refreshsecretkey',
      expiresIn: '7d'
    });

    return { accessToken, refreshToken };
  }
}