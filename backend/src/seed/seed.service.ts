// src/seed/seed.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { DataSource, Not } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Car } from '../car/entities/car.entity';
import { Location } from '../location/entities/location.entity';
import { Insurance } from '../insurance/entities/insurance.entity';
import { ISeedData, ISeedUser, ISeedCar, ISeedLocation, ISeedInsurance } from './interfaces/seed-data.interface';
import * as bcrypt from 'bcrypt';
import { CustomLoggerService } from '../logger/logger.service';
import { UserRole } from '../user/entities/user.entity';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly customLogger: CustomLoggerService,
  ) {}

  async seedAll(): Promise<{ message: string; results: any }> {
    this.customLogger.log('Starting database seeding process...', 'SeedService');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Clear existing data (optional - be careful in production)
      await this.clearData(queryRunner);

      // Seed data
      const seedData = this.getSeedData();
      
      const results = {
        users: await this.seedUsers(queryRunner, seedData.users),
        cars: await this.seedCars(queryRunner, seedData.cars),
        locations: await this.seedLocations(queryRunner, seedData.locations),
        insurance: await this.seedInsurance(queryRunner, seedData.insurance),
      };

      await queryRunner.commitTransaction();

      this.customLogger.log('Database seeding completed successfully', 'SeedService', { results });
      
      return {
        message: 'Database seeded successfully',
        results
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.customLogger.error('Database seeding failed', error.stack, 'SeedService');
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async seedUsers(queryRunner: any, users: ISeedUser[]): Promise<{ count: number; emails: string[] }> {
    this.customLogger.log(`Seeding ${users.length} users...`, 'SeedService');

    const userRepository = queryRunner.manager.getRepository(User);
    const seededUsers: string[] = []; // Explicitly type as string[]

    for (const userData of users) {
      // Check if user already exists
      const existingUser = await userRepository.findOne({
        where: { email: userData.email }
      });

      if (!existingUser) {
        const user = userRepository.create({
          ...userData,
          password: await bcrypt.hash(userData.password, 12),
          isActive: true,
        });

        await userRepository.save(user);
        seededUsers.push(user.email);
        this.customLogger.log(`Created user: ${user.email}`, 'SeedService');
      } else {
        this.customLogger.log(`User already exists: ${userData.email}`, 'SeedService');
        seededUsers.push(userData.email);
      }
    }

    return {
      count: seededUsers.length,
      emails: seededUsers
    };
  }

  async seedCars(queryRunner: any, cars: ISeedCar[]): Promise<{ count: number; models: string[] }> {
    this.customLogger.log(`Seeding ${cars.length} cars...`, 'SeedService');

    const carRepository = queryRunner.manager.getRepository(Car);
    const seededCars: string[] = []; // Explicitly type as string[]

    for (const carData of cars) {
      const existingCar = await carRepository.findOne({
        where: {
          model: carData.model,
          make: carData.make,
          year: carData.year
        }
      });

      if (!existingCar) {
        const car = carRepository.create(carData);
        await carRepository.save(car);
        seededCars.push(`${car.make} ${car.model} (${car.year})`);
        this.customLogger.log(`Created car: ${car.make} ${car.model}`, 'SeedService');
      } else {
        this.customLogger.log(`Car already exists: ${carData.make} ${carData.model}`, 'SeedService');
        seededCars.push(`${carData.make} ${carData.model} (${carData.year})`);
      }
    }

    return {
      count: seededCars.length,
      models: seededCars
    };
  }

  async seedLocations(queryRunner: any, locations: ISeedLocation[]): Promise<{ count: number; names: string[] }> {
    this.customLogger.log(`Seeding ${locations.length} locations...`, 'SeedService');

    const locationRepository = queryRunner.manager.getRepository(Location);
    const seededLocations: string[] = []; // Explicitly type as string[]

    for (const locationData of locations) {
      const existingLocation = await locationRepository.findOne({
        where: { LocationName: locationData.LocationName }
      });

      if (!existingLocation) {
        const location = locationRepository.create(locationData);
        await locationRepository.save(location);
        seededLocations.push(location.LocationName);
        this.customLogger.log(`Created location: ${location.LocationName}`, 'SeedService');
      } else {
        this.customLogger.log(`Location already exists: ${locationData.LocationName}`, 'SeedService');
        seededLocations.push(locationData.LocationName);
      }
    }

    return {
      count: seededLocations.length,
      names: seededLocations
    };
  }

  async seedInsurance(queryRunner: any, insuranceData: ISeedInsurance[]): Promise<{ count: number; policies: string[] }> {
    this.customLogger.log(`Seeding ${insuranceData.length} insurance policies...`, 'SeedService');

    const insuranceRepository = queryRunner.manager.getRepository(Insurance);
    const carRepository = queryRunner.manager.getRepository(Car);
    const seededInsurance: string[] = []; // Explicitly type as string[]

    for (const insurance of insuranceData) {
      // Check if car exists
      const car = await carRepository.findOne({
        where: { id: insurance.carId }
      });

      if (!car) {
        this.customLogger.warn(`Car with ID ${insurance.carId} not found for insurance`, 'SeedService');
        continue;
      }

      const existingInsurance = await insuranceRepository.findOne({
        where: { car: { id: insurance.carId } }
      });

      if (!existingInsurance) {
        const insurancePolicy = insuranceRepository.create({
          ...insurance,
          car: car,
          expiryDate: new Date(insurance.endDate)
        });

        await insuranceRepository.save(insurancePolicy);
        seededInsurance.push(insurancePolicy.policyNumber);
        this.customLogger.log(`Created insurance: ${insurancePolicy.policyNumber}`, 'SeedService');
      } else {
        this.customLogger.log(`Insurance already exists for car ID ${insurance.carId}`, 'SeedService');
        seededInsurance.push(existingInsurance.policyNumber);
      }
    }

    return {
      count: seededInsurance.length,
      policies: seededInsurance
    };
  }

  private async clearData(queryRunner: any): Promise<void> {
    this.customLogger.log('Clearing existing data...', 'SeedService');

    // Only clear in development environment
    if (process.env.NODE_ENV !== 'development') {
      this.customLogger.warn('Data clearing skipped in non-development environment', 'SeedService');
      return;
    }

    try {
      // Delete in correct order to handle foreign key constraints
      await queryRunner.manager.delete(Insurance, {});
      await queryRunner.manager.delete(Location, {});
      await queryRunner.manager.delete(Car, {});
      
      // Don't delete admin users - use TypeORM's Not operator
      await queryRunner.manager.delete(User, { 
        role: Not(UserRole.SUPER_ADMIN) 
      });
      
      this.customLogger.log('Existing data cleared', 'SeedService');
    } catch (error) {
      this.customLogger.error('Error clearing data', error.stack, 'SeedService');
      throw error;
    }
  }

  private getSeedData(): ISeedData {
    return {
      users: [
        {
          email: 'manager@carrental.com',
          password: 'manager123',
          firstName: 'John',
          lastName: 'Manager',
          phoneNumber: '+1-555-0101',
          role: 'manager' as const,
        },
        {
          email: 'driver1@carrental.com',
          password: 'driver123',
          firstName: 'Mike',
          lastName: 'Driver',
          phoneNumber: '+1-555-0102',
          licenseNumber: 'DRIVER001',
          role: 'driver' as const,
        },
        {
          email: 'driver2@carrental.com',
          password: 'driver123',
          firstName: 'Sarah',
          lastName: 'Driver',
          phoneNumber: '+1-555-0103',
          licenseNumber: 'DRIVER002',
          role: 'driver' as const,
        },
        {
          email: 'customer1@example.com',
          password: 'customer123',
          firstName: 'Alice',
          lastName: 'Johnson',
          phoneNumber: '+1-555-0201',
          role: 'customer' as const,
        },
        {
          email: 'customer2@example.com',
          password: 'customer123',
          firstName: 'Bob',
          lastName: 'Smith',
          phoneNumber: '+1-555-0202',
          role: 'customer' as const,
        }
      ],
      cars: [
        {
          model: 'Camry',
          make: 'Toyota',
          year: 2023,
          color: 'Silver',
          rentalRate: 45.50,
          isAvailable: true
        },
        {
          model: 'Civic',
          make: 'Honda',
          year: 2024,
          color: 'Blue',
          rentalRate: 40.00,
          isAvailable: true
        },
        {
          model: 'Model 3',
          make: 'Tesla',
          year: 2024,
          color: 'Red',
          rentalRate: 75.00,
          isAvailable: true
        },
        {
          model: 'Accord',
          make: 'Honda',
          year: 2023,
          color: 'Black',
          rentalRate: 42.00,
          isAvailable: true
        },
        {
          model: 'Corolla',
          make: 'Toyota',
          year: 2024,
          color: 'White',
          rentalRate: 38.50,
          isAvailable: false
        }
      ],
      locations: [
        {
          LocationName: 'Downtown Branch',
          Address: '123 Main Street, Downtown, Cityville',
          ContactNumber: '+1-555-1001'
        },
        {
          LocationName: 'Airport Branch',
          Address: '456 Airport Road, Airport Zone, Cityville',
          ContactNumber: '+1-555-1002'
        },
        {
          LocationName: 'Suburban Branch',
          Address: '789 Oak Avenue, Suburbia, Cityville',
          ContactNumber: '+1-555-1003'
        },
        {
          LocationName: 'Mall Branch',
          Address: '321 Shopping Mall Drive, Retail District, Cityville',
          ContactNumber: '+1-555-1004'
        }
      ],
      insurance: [
        {
          carId: 1,
          provider: 'State Farm',
          policyNumber: 'SF2024001',
          coverageType: 'Comprehensive',
          startDate: '2024-01-01',
          endDate: '2025-01-01',
          premium: 1200.00
        },
        {
          carId: 2,
          provider: 'Geico',
          policyNumber: 'GC2024001',
          coverageType: 'Liability',
          startDate: '2024-02-01',
          endDate: '2025-02-01',
          premium: 800.50
        },
        {
          carId: 3,
          provider: 'Allstate',
          policyNumber: 'AL2024001',
          coverageType: 'Full Coverage',
          startDate: '2024-01-15',
          endDate: '2025-01-15',
          premium: 1500.75
        },
        {
          carId: 4,
          provider: 'Progressive',
          policyNumber: 'PR2024001',
          coverageType: 'Comprehensive',
          startDate: '2024-03-01',
          endDate: '2025-03-01',
          premium: 1100.00
        }
      ]
    };
  }

  async getSeedStatus(): Promise<{ tables: any }> {
    const userCount = await this.dataSource.getRepository(User).count();
    const carCount = await this.dataSource.getRepository(Car).count();
    const locationCount = await this.dataSource.getRepository(Location).count();
    const insuranceCount = await this.dataSource.getRepository(Insurance).count();

    return {
      tables: {
        users: userCount,
        cars: carCount,
        locations: locationCount,
        insurance: insuranceCount
      }
    };
  }
}