// src/auth/auth.controller.ts
import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Get, 
  Patch, 
  Param,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
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
  @HttpCode(HttpStatus.CREATED)
  async registerCustomer(@Body() createUserDto: CreateUserDto) {
    console.log('🔐 Registering customer:', { email: createUserDto.email });
    const customerData = {
      ...createUserDto,
      role: UserRole.CUSTOMER 
    };
    
    try {
      const result = await this.authService.register(customerData);
      console.log('✅ Customer registered successfully:', { email: createUserDto.email, id: result.user.id });
      return result;
    } catch (error) {
      console.error('❌ Customer registration failed:', { email: createUserDto.email, error: error.message });
      throw error;
    }
  }

  @Public()
  @Post('register/driver')
  @HttpCode(HttpStatus.CREATED)
  async registerDriver(@Body() createUserDto: CreateUserDto) {
    console.log('🔐 Registering driver:', { email: createUserDto.email });
    
    const driverData = {
      ...createUserDto,
      role: UserRole.DRIVER // Explicitly set role
    };
    
    try {
      const result = await this.authService.register(driverData);
      console.log('✅ Driver registered successfully:', { email: createUserDto.email, id: result.user.id });
      return result;
    } catch (error) {
      console.error('❌ Driver registration failed:', { email: createUserDto.email, error: error.message });
      throw error;
    }
  }

  @Post('register/manager')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async registerManager(@Body() createUserDto: CreateUserDto, @CurrentUser() user: any) {
    console.log('🔐 Registering manager:', { 
      email: createUserDto.email, 
      requestedBy: user.email 
    });
    
    const managerData = {
      ...createUserDto,
      role: UserRole.MANAGER // Explicitly set role
    };
    
    try {
      const result = await this.authService.register(managerData, user);
      console.log('✅ Manager registered successfully:', { email: createUserDto.email, id: result.user.id });
      return result;
    } catch (error) {
      console.error('❌ Manager registration failed:', { email: createUserDto.email, error: error.message });
      throw error;
    }
  }

  @Post('register/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async registerAdmin(@Body() createUserDto: CreateUserDto, @CurrentUser() user: any) {
    console.log('🔐 Registering admin:', { 
      email: createUserDto.email, 
      requestedBy: user.email 
    });
    
    const adminData = {
      ...createUserDto,
      role: UserRole.SUPER_ADMIN // Explicitly set role
    };
    
    try {
      const result = await this.authService.register(adminData, user);
      console.log('✅ Admin registered successfully:', { email: createUserDto.email, id: result.user.id });
      return result;
    } catch (error) {
      console.error('❌ Admin registration failed:', { email: createUserDto.email, error: error.message });
      throw error;
    }
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginUserDto: LoginUserDto) {
    console.log('🔐 Login attempt:', { email: loginUserDto.email });
    
    try {
      const result = await this.authService.login(loginUserDto);
      console.log('✅ Login successful:', { email: loginUserDto.email, id: result.user.id });
      return result;
    } catch (error) {
      console.error('❌ Login failed:', { email: loginUserDto.email, error: error.message });
      throw error;
    }
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: { refreshToken: string }) {
    console.log('🔄 Refresh token attempt');
    
    try {
      const result = await this.authService.refreshTokens(refreshTokenDto.refreshToken);
      console.log('✅ Token refresh successful');
      return result;
    } catch (error) {
      console.error('❌ Token refresh failed:', { error: error.message });
      throw error;
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  getProfile(@CurrentUser() user: any) {
    console.log('👤 Profile request:', { email: user.email, id: user.id });
    
    try {
      const result = this.authService.getProfile(user.id);
      console.log('✅ Profile retrieved successfully:', { email: user.email });
      return result;
    } catch (error) {
      console.error('❌ Profile retrieval failed:', { email: user.email, error: error.message });
      throw error;
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout(@CurrentUser() user: any) {
    console.log('🚪 Logout request:', { email: user.email, id: user.id });
    
    try {
      const result = this.authService.logout(user.id);
      console.log('✅ Logout successful:', { email: user.email });
      return result;
    } catch (error) {
      console.error('❌ Logout failed:', { email: user.email, error: error.message });
      throw error;
    }
  }

  @Patch('promote-to-manager/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async promoteToManager(@Param('userId') userId: string, @CurrentUser() user: any) {
    console.log('📈 Promote to manager request:', { 
      targetUserId: userId, 
      requestedBy: user.email 
    });
    
    try {
      const result = await this.authService.promoteToManager(userId, user);
      console.log('✅ User promoted to manager successfully:', { userId });
      return result;
    } catch (error) {
      console.error('❌ Promotion to manager failed:', { userId, error: error.message });
      throw error;
    }
  }

  // ==================== DEBUG ENDPOINTS ====================
  
  @Public()
  @Get('debug/users')
  @HttpCode(HttpStatus.OK)
  async debugUsers() {
    console.log('🐛 Debug: Listing all users');
    
    try {
      const users = await this.authService.debugAllUsers();
      console.log('✅ Debug users retrieved successfully. User count:', users.length);
      return {
        message: 'Debug user list',
        count: users.length,
        users: users
      };
    } catch (error) {
      console.error('❌ Debug users failed:', { error: error.message });
      throw error;
    }
  }

  @Public()
  @Post('debug/create-test-admin')
  @HttpCode(HttpStatus.CREATED)
  async createTestAdmin() {
    console.log('🐛 Debug: Creating test admin user');
    
    const testAdminData: CreateUserDto = {
      email: 'testadmin@carrental.com',
      password: 'TestAdmin123!',
      firstName: 'Test',
      lastName: 'Admin',
      phoneNumber: '+1234567890',
      role: UserRole.SUPER_ADMIN
    };
    
    try {
      const result = await this.authService.register(testAdminData);
      console.log('✅ Test admin created successfully:', { email: testAdminData.email, id: result.user.id });
      return {
        message: 'Test admin created successfully',
        user: result.user,
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        }
      };
    } catch (error) {
      console.error('❌ Test admin creation failed:', { error: error.message });
      throw error;
    }
  }

  @Public()
  @Post('debug/create-test-customer')
  @HttpCode(HttpStatus.CREATED)
  async createTestCustomer() {
    console.log('🐛 Debug: Creating test customer user');
    
    const testCustomerData: CreateUserDto = {
      email: 'testcustomer@carrental.com',
      password: 'TestCustomer123!',
      firstName: 'Test',
      lastName: 'Customer',
      phoneNumber: '+1234567891',
      // role will be set to CUSTOMER by default in service
    };
    
    try {
      const result = await this.authService.register(testCustomerData);
      console.log('✅ Test customer created successfully:', { email: testCustomerData.email, id: result.user.id });
      return {
        message: 'Test customer created successfully',
        user: result.user,
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        }
      };
    } catch (error) {
      console.error('❌ Test customer creation failed:', { error: error.message });
      throw error;
    }
  }

  @Public()
  @Get('health')
  @HttpCode(HttpStatus.OK)
  healthCheck() {
    return {
      status: 'OK',
      service: 'Auth Service',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };
  }
}