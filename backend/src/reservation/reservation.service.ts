// src/reservation/reservation.service.ts
import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, MoreThanOrEqual } from 'typeorm';
import { Reservation } from './entities/reservation.entity';
import { Car } from '../car/entities/car.entity';
import { User } from '../user/entities/user.entity';
import { CreateReservationDto, ReservationStatus } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { UserRole } from '../user/entities/user.entity';

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(Car)
    private readonly carRepository: Repository<Car>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createReservationDto: CreateReservationDto): Promise<Reservation> {
    const car = await this.carRepository.findOne({
      where: { id: +createReservationDto.carId },
    });

    if (!car) {
      throw new NotFoundException(`Car with ID ${createReservationDto.carId} not found`);
    }

    if (!car.isAvailable) {
      throw new ConflictException(`Car with ID ${createReservationDto.carId} is not available for reservation`);
    }

    const user = await this.userRepository.findOne({
      where: { id: createReservationDto.userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${createReservationDto.userId} not found`);
    }

    if (user.role !== UserRole.CUSTOMER) {
      throw new BadRequestException('Only customers can create reservations');
    }

    const startDate = new Date(createReservationDto.startDate);
    const endDate = new Date(createReservationDto.endDate);

    // Validate dates
    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    if (startDate < new Date()) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    // Check minimum reservation duration (e.g., 1 hour)
    const minDuration = 60 * 60 * 1000; // 1 hour in milliseconds
    if (endDate.getTime() - startDate.getTime() < minDuration) {
      throw new BadRequestException('Reservation must be for at least 1 hour');
    }

    // Check for conflicting reservations
    const conflictingReservation = await this.reservationRepository.findOne({
      where: {
        car: { id: +createReservationDto.carId },
        status: In([ReservationStatus.PENDING, ReservationStatus.CONFIRMED]),
        startDate: Between(startDate, endDate),
      },
    });

    if (conflictingReservation) {
      throw new ConflictException('Car is already reserved during this period');
    }

    // Check for conflicting rentals
    const conflictingRental = await this.reservationRepository.manager
      .getRepository('Rental')
      .findOne({
        where: {
          car: { id: +createReservationDto.carId },
          status: 'active',
          startDate: Between(startDate, endDate),
        },
      });

    if (conflictingRental) {
      throw new ConflictException('Car is already rented during this period');
    }

    const reservationData = {
      startDate: startDate,
      endDate: endDate,
      totalPrice: createReservationDto.totalPrice,
      status: createReservationDto.status || ReservationStatus.PENDING,
      car: car,
      user: user,
    };

    const reservation = this.reservationRepository.create(reservationData);
    return await this.reservationRepository.save(reservation);
  }

  async findAll(): Promise<Reservation[]> {
    return await this.reservationRepository.find({
      relations: ['car', 'user'],
      order: { startDate: 'DESC' },
    });
  }

  async findOne(id: number, currentUser?: any): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['car', 'user'],
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    // Check if user has permission to view this reservation
    if (currentUser && currentUser.role === UserRole.CUSTOMER && reservation.user.id !== currentUser.id) {
      throw new ForbiddenException('You can only view your own reservations');
    }

    return reservation;
  }

  async findByUserId(userId: string, currentUser?: any): Promise<Reservation[]> {
    // Customers can only view their own reservations
    if (currentUser && currentUser.role === UserRole.CUSTOMER && currentUser.id !== userId) {
      throw new ForbiddenException('You can only view your own reservations');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return await this.reservationRepository.find({
      where: { user: { id: userId } },
      relations: ['car', 'user'],
      order: { startDate: 'DESC' },
    });
  }

  async findByCarId(carId: number): Promise<Reservation[]> {
    const car = await this.carRepository.findOne({
      where: { id: carId },
    });

    if (!car) {
      throw new NotFoundException(`Car with ID ${carId} not found`);
    }

    return await this.reservationRepository.find({
      where: { car: { id: carId } },
      relations: ['car', 'user'],
      order: { startDate: 'DESC' },
    });
  }

  async update(id: number, updateReservationDto: UpdateReservationDto, currentUser?: any): Promise<Reservation> {
    const reservation = await this.findOne(id);

    // Customers can only update their own pending reservations
    if (currentUser && currentUser.role === UserRole.CUSTOMER) {
      if (reservation.user.id !== currentUser.id) {
        throw new ForbiddenException('You can only update your own reservations');
      }
      if (reservation.status !== ReservationStatus.PENDING) {
        throw new ForbiddenException('You can only update pending reservations');
      }
    }

    // If updating car, validate new car
    if (updateReservationDto.carId && +updateReservationDto.carId !== reservation.car.id) {
      const newCar = await this.carRepository.findOne({
        where: { id: +updateReservationDto.carId },
      });

      if (!newCar) {
        throw new NotFoundException(`Car with ID ${updateReservationDto.carId} not found`);
      }

      reservation.car = newCar;
    }

    // If updating user, validate new user is a customer
    if (updateReservationDto.userId && updateReservationDto.userId !== reservation.user.id) {
      const newUser = await this.userRepository.findOne({
        where: { id: updateReservationDto.userId },
      });

      if (!newUser) {
        throw new NotFoundException(`User with ID ${updateReservationDto.userId} not found`);
      }

      if (newUser.role !== UserRole.CUSTOMER) {
        throw new BadRequestException('Only customers can be assigned to reservations');
      }

      reservation.user = newUser;
    }

    // Validate and update dates
    if (updateReservationDto.startDate !== undefined) {
      const newStartDate = new Date(updateReservationDto.startDate);
      if (newStartDate < new Date()) {
        throw new BadRequestException('Start date cannot be in the past');
      }
      reservation.startDate = newStartDate;
    }

    if (updateReservationDto.endDate !== undefined) {
      const newEndDate = new Date(updateReservationDto.endDate);
      if (newEndDate < new Date()) {
        throw new BadRequestException('End date cannot be in the past');
      }
      reservation.endDate = newEndDate;
    }

    // Validate date order
    if (reservation.endDate <= reservation.startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    if (updateReservationDto.totalPrice !== undefined) {
      reservation.totalPrice = updateReservationDto.totalPrice;
    }

    if (updateReservationDto.status !== undefined) {
      reservation.status = updateReservationDto.status;
    }

    return await this.reservationRepository.save(reservation);
  }

  async remove(id: number, currentUser?: any): Promise<void> {
    const reservation = await this.findOne(id);

    // Customers can only cancel their own pending reservations
    if (currentUser && currentUser.role === UserRole.CUSTOMER) {
      if (reservation.user.id !== currentUser.id) {
        throw new ForbiddenException('You can only cancel your own reservations');
      }
      if (reservation.status !== ReservationStatus.PENDING) {
        throw new ForbiddenException('You can only cancel pending reservations');
      }
    }

    // Managers/Admins can delete any reservation except confirmed ones
    if (reservation.status === ReservationStatus.CONFIRMED) {
      throw new BadRequestException('Cannot delete confirmed reservation. Cancel it first.');
    }

    await this.reservationRepository.remove(reservation);
  }

  async findByStatus(status: ReservationStatus): Promise<Reservation[]> {
    return await this.reservationRepository.find({
      where: { status },
      relations: ['car', 'user'],
      order: { startDate: 'DESC' },
    });
  }

  async updateStatus(id: number, status: ReservationStatus): Promise<Reservation> {
    const reservation = await this.findOne(id);
    
    // Validate status transition
    if (reservation.status === ReservationStatus.CANCELLED && status !== ReservationStatus.CANCELLED) {
      throw new BadRequestException('Cannot change status from cancelled');
    }

    if (reservation.status === ReservationStatus.COMPLETED && status !== ReservationStatus.COMPLETED) {
      throw new BadRequestException('Cannot change status from completed');
    }

    reservation.status = status;
    return await this.reservationRepository.save(reservation);
  }

  async confirmReservation(id: number): Promise<Reservation> {
    const reservation = await this.findOne(id);
    
    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException('Only pending reservations can be confirmed');
    }

    // Check if car is still available
    const availability = await this.checkCarAvailability(reservation.car.id, reservation.startDate.toISOString(), reservation.endDate.toISOString());
    if (!availability.available) {
      throw new ConflictException('Car is no longer available for the requested period');
    }

    reservation.status = ReservationStatus.CONFIRMED;
    return await this.reservationRepository.save(reservation);
  }

  async cancelReservation(id: number, currentUser?: any): Promise<Reservation> {
    const reservation = await this.findOne(id);

    // Customers can only cancel their own reservations
    if (currentUser && currentUser.role === UserRole.CUSTOMER && reservation.user.id !== currentUser.id) {
      throw new ForbiddenException('You can only cancel your own reservations');
    }
    
    if (reservation.status === ReservationStatus.CANCELLED) {
      throw new BadRequestException('Reservation is already cancelled');
    }

    if (reservation.status === ReservationStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed reservation');
    }

    reservation.status = ReservationStatus.CANCELLED;
    return await this.reservationRepository.save(reservation);
  }

  async getUpcomingReservations(days: number = 7): Promise<Reservation[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    return await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.startDate <= :targetDate', { targetDate })
      .andWhere('reservation.startDate >= :today', { today: new Date() })
      .andWhere('reservation.status IN (:...statuses)', { statuses: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] })
      .leftJoinAndSelect('reservation.car', 'car')
      .leftJoinAndSelect('reservation.user', 'user')
      .orderBy('reservation.startDate', 'ASC')
      .getMany();
  }

  async getReservationStats(): Promise<{
    totalReservations: number;
    pendingReservations: number;
    confirmedReservations: number;
    cancelledReservations: number;
    completedReservations: number;
    totalRevenue: number;
    averageReservationValue: number;
  }> {
    const [total, pending, confirmed, cancelled, completed] = await Promise.all([
      this.reservationRepository.count(),
      this.reservationRepository.count({ where: { status: ReservationStatus.PENDING } }),
      this.reservationRepository.count({ where: { status: ReservationStatus.CONFIRMED } }),
      this.reservationRepository.count({ where: { status: ReservationStatus.CANCELLED } }),
      this.reservationRepository.count({ where: { status: ReservationStatus.COMPLETED } }),
    ]);

    const revenueResult = await this.reservationRepository
      .createQueryBuilder('reservation')
      .select('SUM(reservation.totalPrice)', 'totalRevenue')
      .addSelect('AVG(reservation.totalPrice)', 'averageValue')
      .where('reservation.status = :status', { status: ReservationStatus.CONFIRMED })
      .getRawOne();

    return {
      totalReservations: total,
      pendingReservations: pending,
      confirmedReservations: confirmed,
      cancelledReservations: cancelled,
      completedReservations: completed,
      totalRevenue: parseFloat(revenueResult.totalRevenue) || 0,
      averageReservationValue: parseFloat(revenueResult.averageValue) || 0,
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

    // Check for conflicting reservations
    const conflictingReservation = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.carId = :carId', { carId })
      .andWhere('reservation.status IN (:...statuses)', { statuses: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] })
      .andWhere('reservation.startDate <= :end', { end })
      .andWhere('reservation.endDate >= :start', { start })
      .getOne();

    if (conflictingReservation) {
      return { available: false, message: 'Car is already reserved during this period' };
    }

    // Check for conflicting rentals
    const conflictingRental = await this.reservationRepository.manager
      .getRepository('Rental')
      .createQueryBuilder('rental')
      .where('rental.carId = :carId', { carId })
      .andWhere('rental.status = :status', { status: 'active' })
      .andWhere('rental.startDate <= :end', { end })
      .andWhere('rental.endDate >= :start', { start })
      .getOne();

    if (conflictingRental) {
      return { available: false, message: 'Car is already rented during this period' };
    }

    return { available: true };
  }

  async getExpiringReservations(hours: number = 24): Promise<Reservation[]> {
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + hours);

    return await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.startDate <= :expiryTime', { expiryTime })
      .andWhere('reservation.startDate >= :now', { now: new Date() })
      .andWhere('reservation.status = :status', { status: ReservationStatus.PENDING })
      .leftJoinAndSelect('reservation.car', 'car')
      .leftJoinAndSelect('reservation.user', 'user')
      .orderBy('reservation.startDate', 'ASC')
      .getMany();
  }
}