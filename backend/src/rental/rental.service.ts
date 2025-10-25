import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Rental } from './entities/rental.entity';
import { Car } from '../car/entities/car.entity';
import { Customer } from '../customer/entities/customer.entity';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalDto } from './dto/update-rental.dto';

@Injectable()
export class RentalService {
  constructor(
    @InjectRepository(Rental)
    private readonly rentalRepository: Repository<Rental>,
    @InjectRepository(Car)
    private readonly carRepository: Repository<Car>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(createRentalDto: CreateRentalDto): Promise<Rental> {
    // Check if car exists and is available
    const car = await this.carRepository.findOne({
      where: { id: +createRentalDto.carId },
    });

    if (!car) {
      throw new NotFoundException(`Car with ID ${createRentalDto.carId} not found`);
    }

    if (!car.isAvailable) {
      throw new ConflictException(`Car with ID ${createRentalDto.carId} is not available for rental`);
    }

    // Check if customer exists
    const customer = await this.customerRepository.findOne({
      where: { id: +createRentalDto.customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${createRentalDto.customerId} not found`);
    }

    // Check for date conflicts
    const startDate = new Date(createRentalDto.startDate);
    const endDate = new Date(createRentalDto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Check if car is already rented during this period
    const existingRental = await this.rentalRepository.findOne({
      where: {
        car: { id: +createRentalDto.carId },
        status: 'active',
        startDate: Between(startDate, endDate),
      },
    });

    if (existingRental) {
      throw new ConflictException('Car is already rented during this period');
    }

    // Map DTO to entity
    const rentalData = {
      startDate: startDate,
      endDate: endDate,
      totalCost: createRentalDto.totalCost,
      status: createRentalDto.status || 'active',
      car: car,
      customer: customer,
    };

    // Update car availability
    car.isAvailable = false;
    await this.carRepository.save(car);

    const rental = this.rentalRepository.create(rentalData);
    return await this.rentalRepository.save(rental);
  }

  async findAll(): Promise<Rental[]> {
    return await this.rentalRepository.find({
      relations: ['car', 'customer', 'payments'],
      order: { startDate: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Rental> {
    const rental = await this.rentalRepository.findOne({
      where: { id },
      relations: ['car', 'customer', 'payments'],
    });

    if (!rental) {
      throw new NotFoundException(`Rental with ID ${id} not found`);
    }

    return rental;
  }

  async findByCustomerId(customerId: number): Promise<Rental[]> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    return await this.rentalRepository.find({
      where: { customer: { id: customerId } },
      relations: ['car', 'customer', 'payments'],
      order: { startDate: 'DESC' },
    });
  }

  async findByCarId(carId: number): Promise<Rental[]> {
    const car = await this.carRepository.findOne({
      where: { id: carId },
    });

    if (!car) {
      throw new NotFoundException(`Car with ID ${carId} not found`);
    }

    return await this.rentalRepository.find({
      where: { car: { id: carId } },
      relations: ['car', 'customer', 'payments'],
      order: { startDate: 'DESC' },
    });
  }

  async update(id: number, updateRentalDto: UpdateRentalDto): Promise<Rental> {
    const rental = await this.findOne(id);

    // If updating carId, check if new car exists and is available
    if (updateRentalDto.carId && +updateRentalDto.carId !== rental.car.id) {
      const newCar = await this.carRepository.findOne({
        where: { id: +updateRentalDto.carId },
      });

      if (!newCar) {
        throw new NotFoundException(`Car with ID ${updateRentalDto.carId} not found`);
      }

      if (!newCar.isAvailable) {
        throw new ConflictException(`Car with ID ${updateRentalDto.carId} is not available`);
      }

      // Make old car available
      rental.car.isAvailable = true;
      await this.carRepository.save(rental.car);

      // Update to new car and make it unavailable
      newCar.isAvailable = false;
      await this.carRepository.save(newCar);

      rental.car = newCar;
    }

    // If updating customerId, check if new customer exists
    if (updateRentalDto.customerId && +updateRentalDto.customerId !== rental.customer.id) {
      const newCustomer = await this.customerRepository.findOne({
        where: { id: +updateRentalDto.customerId },
      });

      if (!newCustomer) {
        throw new NotFoundException(`Customer with ID ${updateRentalDto.customerId} not found`);
      }

      rental.customer = newCustomer;
    }

    // Update other fields
    if (updateRentalDto.startDate !== undefined) {
      rental.startDate = new Date(updateRentalDto.startDate);
    }
    if (updateRentalDto.endDate !== undefined) {
      rental.endDate = new Date(updateRentalDto.endDate);
    }
    if (updateRentalDto.totalCost !== undefined) {
      rental.totalCost = updateRentalDto.totalCost;
    }
    if (updateRentalDto.status !== undefined) {
      rental.status = updateRentalDto.status;

      // If status changes to completed/cancelled, make car available
      if (['completed', 'cancelled'].includes(updateRentalDto.status) && rental.car) {
        rental.car.isAvailable = true;
        await this.carRepository.save(rental.car);
      }
    }

    return await this.rentalRepository.save(rental);
  }

  async remove(id: number): Promise<void> {
    const rental = await this.findOne(id);
    
    // Make car available when rental is deleted
    if (rental.car) {
      rental.car.isAvailable = true;
      await this.carRepository.save(rental.car);
    }

    await this.rentalRepository.remove(rental);
  }

  async findByStatus(status: string): Promise<Rental[]> {
    return await this.rentalRepository.find({
      where: { status },
      relations: ['car', 'customer', 'payments'],
      order: { startDate: 'DESC' },
    });
  }

  async updateStatus(id: number, status: string): Promise<Rental> {
    const rental = await this.findOne(id);
    rental.status = status;

    // If status changes to completed/cancelled, make car available
    if (['completed', 'cancelled'].includes(status) && rental.car) {
      rental.car.isAvailable = true;
      await this.carRepository.save(rental.car);
    }

    return await this.rentalRepository.save(rental);
  }

  async getActiveRentals(): Promise<Rental[]> {
    return await this.rentalRepository.find({
      where: { status: 'active' },
      relations: ['car', 'customer', 'payments'],
      order: { startDate: 'ASC' },
    });
  }

  async getRentalStats(): Promise<{
    totalRentals: number;
    activeRentals: number;
    completedRentals: number;
    totalRevenue: number;
  }> {
    const [totalRentals, activeRentals, completedRentals] = await Promise.all([
      this.rentalRepository.count(),
      this.rentalRepository.count({ where: { status: 'active' } }),
      this.rentalRepository.count({ where: { status: 'completed' } }),
    ]);

    const revenueResult = await this.rentalRepository
      .createQueryBuilder('rental')
      .select('SUM(rental.totalCost)', 'totalRevenue')
      .where('rental.status = :status', { status: 'completed' })
      .getRawOne();

    return {
      totalRentals,
      activeRentals,
      completedRentals,
      totalRevenue: parseFloat(revenueResult.totalRevenue) || 0,
    };
  }

  async checkCarAvailability(carId: number, startDate: string, endDate: string): Promise<{ available: boolean; message?: string }> {
    const car = await this.carRepository.findOne({ where: { id: carId } });
    
    if (!car) {
      return { available: false, message: 'Car not found' };
    }

    if (!car.isAvailable) {
      return { available: false, message: 'Car is not available' };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const conflictingRental = await this.rentalRepository.findOne({
      where: {
        car: { id: carId },
        status: 'active',
        startDate: Between(start, end),
      },
    });

    if (conflictingRental) {
      return { available: false, message: 'Car is already rented during this period' };
    }

    return { available: true };
  }
}