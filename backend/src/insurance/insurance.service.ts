import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Insurance } from './entities/insurance.entity';
import { Car } from '../car/entities/car.entity';
import { CreateInsuranceDto } from './dto/create-insurance.dto';
import { UpdateInsuranceDto } from './dto/update-insurance.dto';

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

    // Map DTO properties to entity properties
    const insuranceData = {
      provider: createInsuranceDto.insuranceProvider, // Map insuranceProvider → provider
      policyNumber: createInsuranceDto.policyNumber,
      coverageType: 'Comprehensive', // Default value since DTO doesn't have this
      expiryDate: new Date(createInsuranceDto.endDate), // Map endDate → expiryDate
      premium: 500.00, // Default value since DTO doesn't have this
      car: car,
    };

    const insurance = this.insuranceRepository.create(insuranceData);
    return await this.insuranceRepository.save(insurance);
  }

  async findAll(): Promise<Insurance[]> {
    return await this.insuranceRepository.find({
      relations: ['car'],
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

    // Map DTO properties to entity properties
    if (updateInsuranceDto.insuranceProvider !== undefined) {
      insurance.provider = updateInsuranceDto.insuranceProvider;
    }
    if (updateInsuranceDto.policyNumber !== undefined) {
      insurance.policyNumber = updateInsuranceDto.policyNumber;
    }
    if (updateInsuranceDto.endDate !== undefined) {
      insurance.expiryDate = new Date(updateInsuranceDto.endDate);
    }

    return await this.insuranceRepository.save(insurance);
  }

  async remove(id: number): Promise<void> {
    const insurance = await this.findOne(id);
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
      .getMany();
  }

  async isInsuranceValid(carId: number): Promise<{ isValid: boolean; insurance?: Insurance }> {
    try {
      const insurance = await this.findByCarId(carId);
      const isValid = insurance.expiryDate > new Date();
      return { isValid, insurance };
    } catch (error) {
      return { isValid: false };
    }
  }
}