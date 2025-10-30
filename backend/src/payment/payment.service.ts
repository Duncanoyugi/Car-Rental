import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Rental } from '../rental/entities/rental.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Rental)
    private readonly rentalRepository: Repository<Rental>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const rental = await this.rentalRepository.findOne({
      where: { id: +createPaymentDto.rentalId },
    });

    if (!rental) {
      throw new NotFoundException(`Rental with ID ${createPaymentDto.rentalId} not found`);
    }
    if (createPaymentDto.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }
    const paymentData = {
      paymentDate: new Date(createPaymentDto.paymentDate),
      amount: createPaymentDto.amount,
      paymentMethod: createPaymentDto.paymentMethod,
      rental: rental,
    };

    const payment = this.paymentRepository.create(paymentData);
    return await this.paymentRepository.save(payment);
  }

  async findAll(): Promise<Payment[]> {
    return await this.paymentRepository.find({
      relations: ['rental', 'rental.car', 'rental.customer'],
      order: { paymentDate: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['rental', 'rental.car', 'rental.customer'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async findByRentalId(rentalId: number): Promise<Payment[]> {
    const rental = await this.rentalRepository.findOne({
      where: { id: rentalId },
    });

    if (!rental) {
      throw new NotFoundException(`Rental with ID ${rentalId} not found`);
    }

    return await this.paymentRepository.find({
      where: { rental: { id: rentalId } },
      relations: ['rental', 'rental.car', 'rental.customer'],
      order: { paymentDate: 'DESC' },
    });
  }

  async update(id: number, updatePaymentDto: UpdatePaymentDto): Promise<Payment> {
    const payment = await this.findOne(id);
    if (updatePaymentDto.rentalId && +updatePaymentDto.rentalId !== payment.rental.id) {
      const newRental = await this.rentalRepository.findOne({
        where: { id: +updatePaymentDto.rentalId },
      });

      if (!newRental) {
        throw new NotFoundException(`Rental with ID ${updatePaymentDto.rentalId} not found`);
      }

      payment.rental = newRental;
    }
    if (updatePaymentDto.paymentDate !== undefined) {
      payment.paymentDate = new Date(updatePaymentDto.paymentDate);
    }
    if (updatePaymentDto.amount !== undefined) {
      if (updatePaymentDto.amount <= 0) {
        throw new BadRequestException('Payment amount must be greater than 0');
      }
      payment.amount = updatePaymentDto.amount;
    }
    if (updatePaymentDto.paymentMethod !== undefined) {
      payment.paymentMethod = updatePaymentDto.paymentMethod;
    }

    return await this.paymentRepository.save(payment);
  }

  async remove(id: number): Promise<void> {
    const payment = await this.findOne(id);
    await this.paymentRepository.remove(payment);
  }

  async findByPaymentMethod(paymentMethod: string): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { paymentMethod },
      relations: ['rental', 'rental.car', 'rental.customer'],
      order: { paymentDate: 'DESC' },
    });
  }

  async getPaymentsByDateRange(startDate: string, endDate: string): Promise<Payment[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return await this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.paymentDate BETWEEN :startDate AND :endDate', { startDate: start, endDate: end })
      .leftJoinAndSelect('payment.rental', 'rental')
      .leftJoinAndSelect('rental.car', 'car')
      .leftJoinAndSelect('rental.customer', 'customer')
      .orderBy('payment.paymentDate', 'DESC')
      .getMany();
  }

  async getTotalRevenue(): Promise<{ totalRevenue: number; paymentCount: number }> {
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'totalRevenue')
      .addSelect('COUNT(payment.id)', 'paymentCount')
      .getRawOne();

    return {
      totalRevenue: parseFloat(result.totalRevenue) || 0,
      paymentCount: parseInt(result.paymentCount) || 0,
    };
  }

  async getRevenueByDateRange(startDate: string, endDate: string): Promise<{ revenue: number; paymentCount: number }> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'revenue')
      .addSelect('COUNT(payment.id)', 'paymentCount')
      .where('payment.paymentDate BETWEEN :startDate AND :endDate', { startDate: start, endDate: end })
      .getRawOne();

    return {
      revenue: parseFloat(result.revenue) || 0,
      paymentCount: parseInt(result.paymentCount) || 0,
    };
  }

  async getPaymentMethodsSummary(): Promise<{ paymentMethod: string; totalAmount: number; count: number }[]> {
    return await this.paymentRepository
      .createQueryBuilder('payment')
      .select('payment.paymentMethod', 'paymentMethod')
      .addSelect('SUM(payment.amount)', 'totalAmount')
      .addSelect('COUNT(payment.id)', 'count')
      .groupBy('payment.paymentMethod')
      .getRawMany();
  }
}