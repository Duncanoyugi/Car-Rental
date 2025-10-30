// src/rental/rental.service.ts
import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Rental } from './entities/rental.entity';
import { Car } from '../car/entities/car.entity';
import { User } from '../user/entities/user.entity';
import { CreateRentalDto, RentalStatus } from './dto/create-rental.dto';
import { UpdateRentalDto } from './dto/update-rental.dto';
import { UserRole } from '../user/entities/user.entity';

@Injectable()
export class RentalService {
  constructor(
    @InjectRepository(Rental)
    private readonly rentalRepository: Repository<Rental>,
    @InjectRepository(Car)
    private readonly carRepository: Repository<Car>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createRentalDto: CreateRentalDto): Promise<Rental> {
    const car = await this.carRepository.findOne({
      where: { id: +createRentalDto.carId },
    });

    if (!car) {
      throw new NotFoundException(`Car with ID ${createRentalDto.carId} not found`);
    }

    if (!car.isAvailable) {
      throw new ConflictException(`Car with ID ${createRentalDto.carId} is not available for rental`);
    }

    const user = await this.userRepository.findOne({
      where: { id: createRentalDto.userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${createRentalDto.userId} not found`);
    }

    if (user.role !== UserRole.CUSTOMER) {
      throw new BadRequestException('Only customers can create rentals');
    }

    // Validate dates
    const startDate = new Date(createRentalDto.startDate);
    const endDate = new Date(createRentalDto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    if (startDate < new Date()) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    // Check minimum rental duration (e.g., 1 day)
    const minDuration = 24 * 60 * 60 * 1000; // 1 day in milliseconds
    if (endDate.getTime() - startDate.getTime() < minDuration) {
      throw new BadRequestException('Rental must be for at least 1 day');
    }

    // Check for conflicting rentals
    const conflictingRental = await this.rentalRepository.findOne({
      where: {
        car: { id: +createRentalDto.carId },
        status: RentalStatus.ACTIVE,
        startDate: Between(startDate, endDate),
      },
    });

    if (conflictingRental) {
      throw new ConflictException('Car is already rented during this period');
    }

    // Check for conflicting reservations
    const conflictingReservation = await this.rentalRepository.manager
      .getRepository('Reservation')
      .findOne({
        where: {
          car: { id: +createRentalDto.carId },
          status:(['pending', 'confirmed']),
          startDate: Between(startDate, endDate),
        },
      });

    if (conflictingReservation) {
      throw new ConflictException('Car is already reserved during this period');
    }

    // Check if car has valid insurance
    const insurance = await this.rentalRepository.manager
      .getRepository('Insurance')
      .findOne({
        where: {
          car: { id: +createRentalDto.carId },
          expiryDate: MoreThanOrEqual(new Date()),
        },
      });

    if (!insurance) {
      throw new ConflictException('Car does not have valid insurance');
    }

    const rentalData = {
      startDate: startDate,
      endDate: endDate,
      totalCost: createRentalDto.totalCost,
      status: createRentalDto.status || RentalStatus.ACTIVE,
      car: car,
      user: user,
    };

    // Update car availability
    car.isAvailable = false;
    await this.carRepository.save(car);

    const rental = this.rentalRepository.create(rentalData);
    return await this.rentalRepository.save(rental);
  }

  async findAll(): Promise<Rental[]> {
    return await this.rentalRepository.find({
      relations: ['car', 'user', 'payments'],
      order: { startDate: 'DESC' },
    });
  }

  async findOne(id: number, currentUser?: any): Promise<Rental> {
    const rental = await this.rentalRepository.findOne({
      where: { id },
      relations: ['car', 'user', 'payments'],
    });

    if (!rental) {
      throw new NotFoundException(`Rental with ID ${id} not found`);
    }

    // Check if user has permission to view this rental
    if (currentUser && currentUser.role === UserRole.CUSTOMER && rental.user.id !== currentUser.id) {
      throw new ForbiddenException('You can only view your own rentals');
    }

    return rental;
  }

  async findByUserId(userId: string, currentUser?: any): Promise<Rental[]> {
    // Customers can only view their own rentals
    if (currentUser && currentUser.role === UserRole.CUSTOMER && currentUser.id !== userId) {
      throw new ForbiddenException('You can only view your own rentals');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return await this.rentalRepository.find({
      where: { user: { id: userId } },
      relations: ['car', 'user', 'payments'],
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
      relations: ['car', 'user', 'payments'],
      order: { startDate: 'DESC' },
    });
  }

  async update(id: number, updateRentalDto: UpdateRentalDto, currentUser?: any): Promise<Rental> {
    const rental = await this.findOne(id);

    // Customers can only update their own active rentals
    if (currentUser && currentUser.role === UserRole.CUSTOMER) {
      if (rental.user.id !== currentUser.id) {
        throw new ForbiddenException('You can only update your own rentals');
      }
      if (rental.status !== RentalStatus.ACTIVE) {
        throw new ForbiddenException('You can only update active rentals');
      }
    }

    // If updating car, validate new car
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

    // If updating user, validate new user is a customer
    if (updateRentalDto.userId && updateRentalDto.userId !== rental.user.id) {
      const newUser = await this.userRepository.findOne({
        where: { id: updateRentalDto.userId },
      });

      if (!newUser) {
        throw new NotFoundException(`User with ID ${updateRentalDto.userId} not found`);
      }

      if (newUser.role !== UserRole.CUSTOMER) {
        throw new BadRequestException('Only customers can be assigned to rentals');
      }

      rental.user = newUser;
    }

    // Validate and update dates
    if (updateRentalDto.startDate !== undefined) {
      const newStartDate = new Date(updateRentalDto.startDate);
      if (newStartDate < new Date()) {
        throw new BadRequestException('Start date cannot be in the past');
      }
      rental.startDate = newStartDate;
    }

    if (updateRentalDto.endDate !== undefined) {
      const newEndDate = new Date(updateRentalDto.endDate);
      if (newEndDate < new Date()) {
        throw new BadRequestException('End date cannot be in the past');
      }
      rental.endDate = newEndDate;
    }

    // Validate date order
    if (rental.endDate <= rental.startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    if (updateRentalDto.totalCost !== undefined) {
      rental.totalCost = updateRentalDto.totalCost;
    }

    if (updateRentalDto.status !== undefined) {
      const oldStatus = rental.status;
      rental.status = updateRentalDto.status;

      // Handle car availability based on status changes
      if ((oldStatus === RentalStatus.ACTIVE && updateRentalDto.status !== RentalStatus.ACTIVE) && rental.car) {
        // If moving from active to non-active, make car available
        rental.car.isAvailable = true;
        await this.carRepository.save(rental.car);
      } else if ((oldStatus !== RentalStatus.ACTIVE && updateRentalDto.status === RentalStatus.ACTIVE) && rental.car) {
        // If moving to active from non-active, make car unavailable
        rental.car.isAvailable = false;
        await this.carRepository.save(rental.car);
      }
    }

    return await this.rentalRepository.save(rental);
  }

  async remove(id: number, currentUser?: any): Promise<void> {
    const rental = await this.findOne(id);

    // Customers cannot delete rentals
    if (currentUser && currentUser.role === UserRole.CUSTOMER) {
      throw new ForbiddenException('You cannot delete rentals');
    }

    // Only allow deletion of cancelled rentals
    if (rental.status === RentalStatus.ACTIVE) {
      throw new BadRequestException('Cannot delete active rental. Cancel it first.');
    }

    // Make car available when rental is deleted
    if (rental.car) {
      rental.car.isAvailable = true;
      await this.carRepository.save(rental.car);
    }

    await this.rentalRepository.remove(rental);
  }

  async findByStatus(status: RentalStatus): Promise<Rental[]> {
    return await this.rentalRepository.find({
      where: { status },
      relations: ['car', 'user', 'payments'],
      order: { startDate: 'DESC' },
    });
  }

  async updateStatus(id: number, status: RentalStatus): Promise<Rental> {
    const rental = await this.findOne(id);
    const oldStatus = rental.status;
    
    // Validate status transition
    if (rental.status === RentalStatus.COMPLETED && status !== RentalStatus.COMPLETED) {
      throw new BadRequestException('Cannot change status from completed');
    }

    if (rental.status === RentalStatus.CANCELLED && status !== RentalStatus.CANCELLED) {
      throw new BadRequestException('Cannot change status from cancelled');
    }

    rental.status = status;

    // Handle car availability based on status changes
    if ((oldStatus === RentalStatus.ACTIVE && status !== RentalStatus.ACTIVE) && rental.car) {
      rental.car.isAvailable = true;
      await this.carRepository.save(rental.car);
    } else if ((oldStatus !== RentalStatus.ACTIVE && status === RentalStatus.ACTIVE) && rental.car) {
      rental.car.isAvailable = false;
      await this.carRepository.save(rental.car);
    }

    return await this.rentalRepository.save(rental);
  }

  async getActiveRentals(): Promise<Rental[]> {
    return await this.rentalRepository.find({
      where: { status: RentalStatus.ACTIVE },
      relations: ['car', 'user', 'payments'],
      order: { startDate: 'ASC' },
    });
  }

  async getOverdueRentals(): Promise<Rental[]> {
    const today = new Date();
    
    return await this.rentalRepository
      .createQueryBuilder('rental')
      .where('rental.endDate < :today', { today })
      .andWhere('rental.status = :status', { status: RentalStatus.ACTIVE })
      .leftJoinAndSelect('rental.car', 'car')
      .leftJoinAndSelect('rental.user', 'user')
      .orderBy('rental.endDate', 'ASC')
      .getMany();
  }

  async getRentalStats(): Promise<{
    totalRentals: number;
    activeRentals: number;
    completedRentals: number;
    cancelledRentals: number;
    overdueRentals: number;
    totalRevenue: number;
    averageRentalValue: number;
  }> {
    const [totalRentals, activeRentals, completedRentals, cancelledRentals] = await Promise.all([
      this.rentalRepository.count(),
      this.rentalRepository.count({ where: { status: RentalStatus.ACTIVE } }),
      this.rentalRepository.count({ where: { status: RentalStatus.COMPLETED } }),
      this.rentalRepository.count({ where: { status: RentalStatus.CANCELLED } }),
    ]);

    const overdueRentals = await this.rentalRepository.count({
      where: {
        status: RentalStatus.ACTIVE,
        endDate: LessThanOrEqual(new Date())
      }
    });

    const revenueResult = await this.rentalRepository
      .createQueryBuilder('rental')
      .select('SUM(rental.totalCost)', 'totalRevenue')
      .addSelect('AVG(rental.totalCost)', 'averageValue')
      .where('rental.status = :status', { status: RentalStatus.COMPLETED })
      .getRawOne();

    return {
      totalRentals,
      activeRentals,
      completedRentals,
      cancelledRentals,
      overdueRentals,
      totalRevenue: parseFloat(revenueResult.totalRevenue) || 0,
      averageRentalValue: parseFloat(revenueResult.averageValue) || 0,
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

    // Check insurance validity
    const insurance = await this.rentalRepository.manager
      .getRepository('Insurance')
      .findOne({
        where: {
          car: { id: carId },
          expiryDate: MoreThanOrEqual(new Date(endDate)),
        },
      });

    if (!insurance) {
      return { available: false, message: 'Car does not have valid insurance for the requested period' };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check for conflicting rentals
    const conflictingRental = await this.rentalRepository.findOne({
      where: {
        car: { id: carId },
        status: RentalStatus.ACTIVE,
        startDate: Between(start, end),
      },
    });

    if (conflictingRental) {
      return { available: false, message: 'Car is already rented during this period' };
    }

    // Check for conflicting reservations
    const conflictingReservation = await this.rentalRepository.manager
      .getRepository('Reservation')
      .createQueryBuilder('reservation')
      .where('reservation.carId = :carId', { carId })
      .andWhere('reservation.status IN (:...statuses)', { statuses: ['pending', 'confirmed'] })
      .andWhere('reservation.startDate <= :end', { end })
      .andWhere('reservation.endDate >= :start', { start })
      .getOne();

    if (conflictingReservation) {
      return { available: false, message: 'Car is already reserved during this period' };
    }

    return { available: true };
  }

  async extendRental(id: number, newEndDate: string, currentUser?: any): Promise<Rental> {
    const rental = await this.findOne(id);

    // Customers can only extend their own active rentals
    if (currentUser && currentUser.role === UserRole.CUSTOMER && rental.user.id !== currentUser.id) {
      throw new ForbiddenException('You can only extend your own rentals');
    }

    if (rental.status !== RentalStatus.ACTIVE) {
      throw new BadRequestException('Only active rentals can be extended');
    }

    const newEnd = new Date(newEndDate);
    if (newEnd <= rental.endDate) {
      throw new BadRequestException('New end date must be after current end date');
    }

    // Check if car is available for the extended period
    const availability = await this.checkCarAvailability(rental.car.id, rental.endDate.toISOString(), newEndDate);
    if (!availability.available) {
      throw new ConflictException('Car is not available for the extended period');
    }

    rental.endDate = newEnd;
    return await this.rentalRepository.save(rental);
  }
}