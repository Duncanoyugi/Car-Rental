// src/car/car.service.ts
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Car } from './entities/car.entity';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { UserRole } from '../user/entities/user.entity';

@Injectable()
export class CarService {
  constructor(
    @InjectRepository(Car)
    private readonly carRepository: Repository<Car>,
  ) {}

  async create(createCarDto: CreateCarDto): Promise<Car> {
    console.log('Creating car with DTO:', createCarDto);
    
    // Check if car with same model and year already exists
    const existingCar = await this.carRepository.findOne({
      where: {
        model: createCarDto.carModel,
        make: createCarDto.manufacturer,
        year: createCarDto.year
      }
    });

    if (existingCar) {
      throw new BadRequestException('A car with the same model, manufacturer, and year already exists');
    }

    const carData = {
      model: createCarDto.carModel,       
      make: createCarDto.manufacturer,     
      year: createCarDto.year,
      color: createCarDto.color,
      rentalRate: createCarDto.rentalRate,
      isAvailable: createCarDto.availability ?? true,
    };

    console.log('Mapped car data:', carData);

    const car = this.carRepository.create(carData);
    return await this.carRepository.save(car);
  }

  async findAll(onlyAvailable: boolean = false): Promise<Car[]> {
    const where = onlyAvailable ? { isAvailable: true } : {};
    
    return await this.carRepository.find({
      where,
      relations: ['rentals', 'reservations', 'maintenances', 'insurance'],
      order: { id: 'ASC' }
    });
  }

  async findAvailable(): Promise<Car[]> {
    return await this.carRepository.find({
      where: { isAvailable: true },
      relations: ['insurance'], // Include insurance for availability checks
      order: { rentalRate: 'ASC' }
    });
  }

  async findOne(id: number): Promise<Car> {
    const car = await this.carRepository.findOne({
      where: { id },
      relations: ['rentals', 'reservations', 'maintenances', 'insurance'],
    });

    if (!car) {
      throw new NotFoundException(`Car with ID ${id} not found`);
    }

    return car;
  }

  async update(id: number, updateCarDto: UpdateCarDto): Promise<Car> {
    const car = await this.findOne(id);
    
    if (updateCarDto.carModel !== undefined) car.model = updateCarDto.carModel;
    if (updateCarDto.manufacturer !== undefined) car.make = updateCarDto.manufacturer;
    if (updateCarDto.year !== undefined) car.year = updateCarDto.year;
    if (updateCarDto.color !== undefined) car.color = updateCarDto.color;
    if (updateCarDto.rentalRate !== undefined) car.rentalRate = updateCarDto.rentalRate;
    if (updateCarDto.availability !== undefined) car.isAvailable = updateCarDto.availability;
    
    return await this.carRepository.save(car);
  }

  async remove(id: number): Promise<void> {
    const car = await this.findOne(id);
    
    // Check if car has active rentals or reservations
    const hasActiveRentals = car.rentals?.some(rental => 
      rental.status === 'active'
    );
    
    const hasActiveReservations = car.reservations?.some(reservation => 
      reservation.status === 'pending' || reservation.status === 'confirmed'
    );

    if (hasActiveRentals) {
      throw new BadRequestException('Cannot delete car with active rentals');
    }

    if (hasActiveReservations) {
      throw new BadRequestException('Cannot delete car with active reservations');
    }

    await this.carRepository.remove(car);
  }

  async updateAvailability(id: number, isAvailable: boolean): Promise<Car> {
    const car = await this.findOne(id);
    car.isAvailable = isAvailable;
    return await this.carRepository.save(car);
  }

  async findByManufacturer(manufacturer: string): Promise<Car[]> {
    return await this.carRepository.find({
      where: { make: manufacturer },
      relations: ['insurance'],
      order: { rentalRate: 'ASC' }
    });
  }

  async getCarStats(): Promise<{
    totalCars: number;
    availableCars: number;
    rentedCars: number;
    averageRentalRate: number;
    totalRevenue: number;
  }> {
    const [totalCars, availableCars] = await Promise.all([
      this.carRepository.count(),
      this.carRepository.count({ where: { isAvailable: true } })
    ]);

    const rentedCars = totalCars - availableCars;

    // Calculate average rental rate
    const avgRateResult = await this.carRepository
      .createQueryBuilder('car')
      .select('AVG(car.rentalRate)', 'averageRate')
      .getRawOne();

    const averageRentalRate = parseFloat(avgRateResult.averageRate) || 0;

    // Calculate total revenue from completed rentals
    const revenueResult = await this.carRepository
      .createQueryBuilder('car')
      .leftJoin('car.rentals', 'rental')
      .select('SUM(rental.totalCost)', 'totalRevenue')
      .where('rental.status = :status', { status: 'completed' })
      .getRawOne();

    const totalRevenue = parseFloat(revenueResult.totalRevenue) || 0;

    return {
      totalCars,
      availableCars,
      rentedCars,
      averageRentalRate,
      totalRevenue
    };
  }

  async searchCars(query: {
    manufacturer?: string;
    minYear?: number;
    maxYear?: number;
    minPrice?: number;
    maxPrice?: number;
    color?: string;
    availableOnly?: boolean;
  }): Promise<Car[]> {
    const qb = this.carRepository.createQueryBuilder('car')
      .leftJoinAndSelect('car.insurance', 'insurance');

    if (query.manufacturer) {
      qb.andWhere('car.make LIKE :manufacturer', { manufacturer: `%${query.manufacturer}%` });
    }

    if (query.minYear) {
      qb.andWhere('car.year >= :minYear', { minYear: query.minYear });
    }

    if (query.maxYear) {
      qb.andWhere('car.year <= :maxYear', { maxYear: query.maxYear });
    }

    if (query.minPrice) {
      qb.andWhere('car.rentalRate >= :minPrice', { minPrice: query.minPrice });
    }

    if (query.maxPrice) {
      qb.andWhere('car.rentalRate <= :maxPrice', { maxPrice: query.maxPrice });
    }

    if (query.color) {
      qb.andWhere('car.color LIKE :color', { color: `%${query.color}%` });
    }

    if (query.availableOnly) {
      qb.andWhere('car.isAvailable = :available', { available: true });
    }

    return await qb.orderBy('car.rentalRate', 'ASC').getMany();
  }
}