// src/insurance/insurance.service.ts
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Insurance } from './entities/insurance.entity';
import { Car } from '../car/entities/car.entity';
import { CreateInsuranceDto } from './dto/create-insurance.dto';
import { UpdateInsuranceDto } from './dto/update-insurance.dto';
import { Between, LessThan } from 'typeorm';

@Injectable()
export class InsuranceService {
  constructor(
    @InjectRepository(Insurance)
    private readonly insuranceRepository: Repository<Insurance>,
    @InjectRepository(Car)
    private readonly carRepository: Repository<Car>,
  ) {}

  async create(createInsuranceDto: CreateInsuranceDto): Promise<Insurance> {
    // Check if car exists
    const car = await this.carRepository.findOne({
      where: { id: +createInsuranceDto.carId },
    });

    if (!car) {
      throw new NotFoundException(`Car with ID ${createInsuranceDto.carId} not found`);
    }

    // Check if car already has insurance (OneToOne relationship)
    const existingInsurance = await this.insuranceRepository.findOne({
      where: { car: { id: +createInsuranceDto.carId } },
    });

    if (existingInsurance) {
      throw new ConflictException(`Car with ID ${createInsuranceDto.carId} already has insurance`);
    }

    // Validate dates
    const startDate = new Date(createInsuranceDto.startDate);
    const endDate = new Date(createInsuranceDto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    if (endDate <= new Date()) {
      throw new BadRequestException('Insurance must have a future expiry date');
    }

    // Map DTO properties to entity properties
    const insuranceData = {
      provider: createInsuranceDto.insuranceProvider,
      policyNumber: createInsuranceDto.policyNumber,
      coverageType: createInsuranceDto.coverageType,
      expiryDate: endDate,
      premium: createInsuranceDto.premium,
      car: car,
    };

    const insurance = this.insuranceRepository.create(insuranceData);
    return await this.insuranceRepository.save(insurance);
  }

  async findAll(): Promise<Insurance[]> {
    return await this.insuranceRepository.find({
      relations: ['car'],
      order: { expiryDate: 'ASC' }
    });
  }

  async findActiveInsurances(): Promise<Insurance[]> {
    return await this.insuranceRepository.find({
      where: { expiryDate: MoreThanOrEqual(new Date()) },
      relations: ['car'],
      order: { expiryDate: 'ASC' }
    });
  }

  async findOne(id: number): Promise<Insurance> {
    const insurance = await this.insuranceRepository.findOne({
      where: { id },
      relations: ['car'],
    });

    if (!insurance) {
      throw new NotFoundException(`Insurance with ID ${id} not found`);
    }

    return insurance;
  }

  async findByCarId(carId: number): Promise<Insurance> {
    const insurance = await this.insuranceRepository.findOne({
      where: { car: { id: carId } },
      relations: ['car'],
    });

    if (!insurance) {
      throw new NotFoundException(`Insurance for car with ID ${carId} not found`);
    }

    return insurance;
  }

  async update(id: number, updateInsuranceDto: UpdateInsuranceDto): Promise<Insurance> {
    const insurance = await this.findOne(id);

    // If updating carId, check if new car exists and doesn't already have insurance
    if (updateInsuranceDto.carId && +updateInsuranceDto.carId !== insurance.car.id) {
      const newCar = await this.carRepository.findOne({
        where: { id: +updateInsuranceDto.carId },
      });

      if (!newCar) {
        throw new NotFoundException(`Car with ID ${updateInsuranceDto.carId} not found`);
      }

      // Check if new car already has insurance
      const existingInsurance = await this.insuranceRepository.findOne({
        where: { car: { id: +updateInsuranceDto.carId } },
      });

      if (existingInsurance && existingInsurance.id !== id) {
        throw new ConflictException(`Car with ID ${updateInsuranceDto.carId} already has insurance`);
      }

      insurance.car = newCar;
    }

    // Validate dates if provided
    if (updateInsuranceDto.endDate !== undefined) {
      const endDate = new Date(updateInsuranceDto.endDate);
      const startDate = updateInsuranceDto.startDate 
        ? new Date(updateInsuranceDto.startDate) 
        : insurance.expiryDate; // Use current expiry date if start date not provided

      if (endDate <= startDate) {
        throw new BadRequestException('End date must be after start date');
      }

      if (endDate <= new Date()) {
        throw new BadRequestException('Insurance must have a future expiry date');
      }

      insurance.expiryDate = endDate;
    }

    // Map DTO properties to entity properties
    if (updateInsuranceDto.insuranceProvider !== undefined) {
      insurance.provider = updateInsuranceDto.insuranceProvider;
    }
    if (updateInsuranceDto.policyNumber !== undefined) {
      insurance.policyNumber = updateInsuranceDto.policyNumber;
    }
    if (updateInsuranceDto.coverageType !== undefined) {
      insurance.coverageType = updateInsuranceDto.coverageType;
    }
    if (updateInsuranceDto.premium !== undefined) {
      insurance.premium = updateInsuranceDto.premium;
    }

    return await this.insuranceRepository.save(insurance);
  }

  async remove(id: number): Promise<void> {
    const insurance = await this.findOne(id);
    
    // Check if the car has active rentals
    const carWithRelations = await this.carRepository.findOne({
      where: { id: insurance.car.id },
      relations: ['rentals']
    });

    if (carWithRelations?.rentals?.some(rental => rental.status === 'active')) {
      throw new BadRequestException('Cannot remove insurance from a car with active rentals');
    }

    await this.insuranceRepository.remove(insurance);
  }

  async getExpiringInsurances(days: number = 30): Promise<Insurance[]> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    return await this.insuranceRepository
      .createQueryBuilder('insurance')
      .where('insurance.expiryDate <= :expiryDate', { expiryDate })
      .andWhere('insurance.expiryDate >= :today', { today: new Date() })
      .leftJoinAndSelect('insurance.car', 'car')
      .orderBy('insurance.expiryDate', 'ASC')
      .getMany();
  }

  async getExpiredInsurances(): Promise<Insurance[]> {
    return await this.insuranceRepository
      .createQueryBuilder('insurance')
      .where('insurance.expiryDate < :today', { today: new Date() })
      .leftJoinAndSelect('insurance.car', 'car')
      .orderBy('insurance.expiryDate', 'DESC')
      .getMany();
  }

  async isInsuranceValid(carId: number): Promise<{ isValid: boolean; insurance?: Insurance; daysUntilExpiry?: number }> {
    try {
      const insurance = await this.findByCarId(carId);
      const today = new Date();
      const expiryDate = new Date(insurance.expiryDate);
      const isValid = expiryDate > today;
      
      const timeDiff = expiryDate.getTime() - today.getTime();
      const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));

      return { isValid, insurance, daysUntilExpiry };
    } catch (error) {
      return { isValid: false };
    }
  }

  async getInsuranceStats(): Promise<{
    totalInsurances: number;
    activeInsurances: number;
    expiredInsurances: number;
    expiringSoon: number;
    totalPremium: number;
  }> {
    const [totalInsurances, activeInsurances, expiredInsurances, expiringSoon] = await Promise.all([
      this.insuranceRepository.count(),
      this.insuranceRepository.count({ where: { expiryDate: MoreThanOrEqual(new Date()) } }),
      this.insuranceRepository.count({ where: { expiryDate: LessThan(new Date()) } }),
      this.insuranceRepository.count({ 
        where: { 
          expiryDate: Between(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) 
        } 
      })
    ]);

    const premiumResult = await this.insuranceRepository
      .createQueryBuilder('insurance')
      .select('SUM(insurance.premium)', 'totalPremium')
      .getRawOne();

    const totalPremium = parseFloat(premiumResult.totalPremium) || 0;

    return {
      totalInsurances,
      activeInsurances,
      expiredInsurances,
      expiringSoon,
      totalPremium
    };
  }

  async renewInsurance(id: number, newEndDate: string): Promise<Insurance> {
    const insurance = await this.findOne(id);
    
    const newExpiryDate = new Date(newEndDate);
    if (newExpiryDate <= insurance.expiryDate) {
      throw new BadRequestException('New expiry date must be after current expiry date');
    }

    insurance.expiryDate = newExpiryDate;
    return await this.insuranceRepository.save(insurance);
  }
}