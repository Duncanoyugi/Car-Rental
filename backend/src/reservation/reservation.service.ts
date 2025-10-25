import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Reservation } from './entities/reservation.entity';
import { Car } from '../car/entities/car.entity';
import { Customer } from '../customer/entities/customer.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(Car)
    private readonly carRepository: Repository<Car>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(createReservationDto: CreateReservationDto): Promise<Reservation> {
    // Check if car exists
    const car = await this.carRepository.findOne({
      where: { id: +createReservationDto.carId },
    });

    if (!car) {
      throw new NotFoundException(`Car with ID ${createReservationDto.carId} not found`);
    }

    // Check if customer exists
    const customer = await this.customerRepository.findOne({
      where: { id: +createReservationDto.customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${createReservationDto.customerId} not found`);
    }

    // Validate dates
    const startDate = new Date(createReservationDto.startDate);
    const endDate = new Date(createReservationDto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Check for reservation conflicts (pending or confirmed reservations)
    const conflictingReservation = await this.reservationRepository.findOne({
      where: {
        car: { id: +createReservationDto.carId },
        status: In(['pending', 'confirmed']),
        startDate: Between(startDate, endDate),
      },
    });

    if (conflictingReservation) {
      throw new ConflictException('Car is already reserved during this period');
    }

    // Map DTO to entity
    const reservationData = {
      startDate: startDate,
      endDate: endDate,
      totalPrice: createReservationDto.totalPrice,
      status: createReservationDto.status || 'pending',
      car: car,
      customer: customer,
    };

    const reservation = this.reservationRepository.create(reservationData);
    return await this.reservationRepository.save(reservation);
  }

  async findAll(): Promise<Reservation[]> {
    return await this.reservationRepository.find({
      relations: ['car', 'customer'],
      order: { startDate: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['car', 'customer'],
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    return reservation;
  }

  async findByCustomerId(customerId: number): Promise<Reservation[]> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    return await this.reservationRepository.find({
      where: { customer: { id: customerId } },
      relations: ['car', 'customer'],
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
      relations: ['car', 'customer'],
      order: { startDate: 'DESC' },
    });
  }

  async update(id: number, updateReservationDto: UpdateReservationDto): Promise<Reservation> {
    const reservation = await this.findOne(id);

    // If updating carId, check if new car exists
    if (updateReservationDto.carId && +updateReservationDto.carId !== reservation.car.id) {
      const newCar = await this.carRepository.findOne({
        where: { id: +updateReservationDto.carId },
      });

      if (!newCar) {
        throw new NotFoundException(`Car with ID ${updateReservationDto.carId} not found`);
      }

      reservation.car = newCar;
    }

    // If updating customerId, check if new customer exists
    if (updateReservationDto.customerId && +updateReservationDto.customerId !== reservation.customer.id) {
      const newCustomer = await this.customerRepository.findOne({
        where: { id: +updateReservationDto.customerId },
      });

      if (!newCustomer) {
        throw new NotFoundException(`Customer with ID ${updateReservationDto.customerId} not found`);
      }

      reservation.customer = newCustomer;
    }

    // Update other fields
    if (updateReservationDto.startDate !== undefined) {
      reservation.startDate = new Date(updateReservationDto.startDate);
    }
    if (updateReservationDto.endDate !== undefined) {
      reservation.endDate = new Date(updateReservationDto.endDate);
    }
    if (updateReservationDto.totalPrice !== undefined) {
      reservation.totalPrice = updateReservationDto.totalPrice;
    }
    if (updateReservationDto.status !== undefined) {
      reservation.status = updateReservationDto.status;
    }

    return await this.reservationRepository.save(reservation);
  }

  async remove(id: number): Promise<void> {
    const reservation = await this.findOne(id);
    await this.reservationRepository.remove(reservation);
  }

  async findByStatus(status: string): Promise<Reservation[]> {
    return await this.reservationRepository.find({
      where: { status },
      relations: ['car', 'customer'],
      order: { startDate: 'DESC' },
    });
  }

  async updateStatus(id: number, status: string): Promise<Reservation> {
    const reservation = await this.findOne(id);
    reservation.status = status;
    return await this.reservationRepository.save(reservation);
  }

  async confirmReservation(id: number): Promise<Reservation> {
    const reservation = await this.findOne(id);
    
    if (reservation.status !== 'pending') {
      throw new BadRequestException('Only pending reservations can be confirmed');
    }

    reservation.status = 'confirmed';
    return await this.reservationRepository.save(reservation);
  }

  async cancelReservation(id: number): Promise<Reservation> {
    const reservation = await this.findOne(id);
    
    if (reservation.status === 'cancelled') {
      throw new BadRequestException('Reservation is already cancelled');
    }

    reservation.status = 'cancelled';
    return await this.reservationRepository.save(reservation);
  }

  async getUpcomingReservations(days: number = 7): Promise<Reservation[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    return await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.startDate <= :targetDate', { targetDate })
      .andWhere('reservation.startDate >= :today', { today: new Date() })
      .andWhere('reservation.status IN (:...statuses)', { statuses: ['pending', 'confirmed'] })
      .leftJoinAndSelect('reservation.car', 'car')
      .leftJoinAndSelect('reservation.customer', 'customer')
      .orderBy('reservation.startDate', 'ASC')
      .getMany();
  }

  async getReservationStats(): Promise<{
    totalReservations: number;
    pendingReservations: number;
    confirmedReservations: number;
    cancelledReservations: number;
    totalRevenue: number;
  }> {
    const [total, pending, confirmed, cancelled] = await Promise.all([
      this.reservationRepository.count(),
      this.reservationRepository.count({ where: { status: 'pending' } }),
      this.reservationRepository.count({ where: { status: 'confirmed' } }),
      this.reservationRepository.count({ where: { status: 'cancelled' } }),
    ]);

    const revenueResult = await this.reservationRepository
      .createQueryBuilder('reservation')
      .select('SUM(reservation.totalPrice)', 'totalRevenue')
      .where('reservation.status = :status', { status: 'confirmed' })
      .getRawOne();

    return {
      totalReservations: total,
      pendingReservations: pending,
      confirmedReservations: confirmed,
      cancelledReservations: cancelled,
      totalRevenue: parseFloat(revenueResult.totalRevenue) || 0,
    };
  }

  async checkCarAvailability(carId: number, startDate: string, endDate: string): Promise<{ available: boolean; message?: string }> {
    const car = await this.carRepository.findOne({ where: { id: carId } });
    
    if (!car) {
      return { available: false, message: 'Car not found' };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check for conflicting reservations using QueryBuilder
    const conflictingReservation = await this.reservationRepository
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
}