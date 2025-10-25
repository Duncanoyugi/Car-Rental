import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Maintenance } from './entities/maintenance.entity';
import { Car } from '../car/entities/car.entity';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(Maintenance)
    private readonly maintenanceRepository: Repository<Maintenance>,
    @InjectRepository(Car)
    private readonly carRepository: Repository<Car>,
  ) {}

  async create(createMaintenanceDto: CreateMaintenanceDto): Promise<Maintenance> {
    // Check if car exists
    const car = await this.carRepository.findOne({
      where: { id: +createMaintenanceDto.carId },
    });

    if (!car) {
      throw new NotFoundException(`Car with ID ${createMaintenanceDto.carId} not found`);
    }

    // Map DTO to entity (convert date string to Date object)
    const maintenanceData = {
      maintenanceType: createMaintenanceDto.maintenanceType,
      description: createMaintenanceDto.description,
      maintenanceDate: new Date(createMaintenanceDto.maintenanceDate),
      cost: createMaintenanceDto.cost,
      status: createMaintenanceDto.status || 'scheduled', // Default value
      car: car,
    };

    const maintenance = this.maintenanceRepository.create(maintenanceData);
    return await this.maintenanceRepository.save(maintenance);
  }

  async findAll(): Promise<Maintenance[]> {
    return await this.maintenanceRepository.find({
      relations: ['car'],
      order: { maintenanceDate: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Maintenance> {
    const maintenance = await this.maintenanceRepository.findOne({
      where: { id },
      relations: ['car'],
    });

    if (!maintenance) {
      throw new NotFoundException(`Maintenance record with ID ${id} not found`);
    }

    return maintenance;
  }

  async findByCarId(carId: number): Promise<Maintenance[]> {
    const car = await this.carRepository.findOne({
      where: { id: carId },
    });

    if (!car) {
      throw new NotFoundException(`Car with ID ${carId} not found`);
    }

    return await this.maintenanceRepository.find({
      where: { car: { id: carId } },
      relations: ['car'],
      order: { maintenanceDate: 'DESC' },
    });
  }

  async update(id: number, updateMaintenanceDto: UpdateMaintenanceDto): Promise<Maintenance> {
    const maintenance = await this.findOne(id);

    // If updating carId, check if new car exists
    if (updateMaintenanceDto.carId && +updateMaintenanceDto.carId !== maintenance.car.id) {
      const newCar = await this.carRepository.findOne({
        where: { id: +updateMaintenanceDto.carId },
      });

      if (!newCar) {
        throw new NotFoundException(`Car with ID ${updateMaintenanceDto.carId} not found`);
      }

      maintenance.car = newCar;
    }

    // Update other fields
    if (updateMaintenanceDto.maintenanceType !== undefined) {
      maintenance.maintenanceType = updateMaintenanceDto.maintenanceType;
    }
    if (updateMaintenanceDto.description !== undefined) {
      maintenance.description = updateMaintenanceDto.description;
    }
    if (updateMaintenanceDto.maintenanceDate !== undefined) {
      maintenance.maintenanceDate = new Date(updateMaintenanceDto.maintenanceDate);
    }
    if (updateMaintenanceDto.cost !== undefined) {
      maintenance.cost = updateMaintenanceDto.cost;
    }
    if (updateMaintenanceDto.status !== undefined) {
      maintenance.status = updateMaintenanceDto.status;
    }

    return await this.maintenanceRepository.save(maintenance);
  }

  async remove(id: number): Promise<void> {
    const maintenance = await this.findOne(id);
    await this.maintenanceRepository.remove(maintenance);
  }

  async findByStatus(status: string): Promise<Maintenance[]> {
    return await this.maintenanceRepository.find({
      where: { status },
      relations: ['car'],
      order: { maintenanceDate: 'DESC' },
    });
  }

  async getUpcomingMaintenance(days: number = 7): Promise<Maintenance[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    return await this.maintenanceRepository
      .createQueryBuilder('maintenance')
      .where('maintenance.maintenanceDate <= :targetDate', { targetDate })
      .andWhere('maintenance.maintenanceDate >= :today', { today: new Date() })
      .andWhere('maintenance.status = :status', { status: 'scheduled' })
      .leftJoinAndSelect('maintenance.car', 'car')
      .orderBy('maintenance.maintenanceDate', 'ASC')
      .getMany();
  }

  async updateStatus(id: number, status: string): Promise<Maintenance> {
    const maintenance = await this.findOne(id);
    maintenance.status = status;
    return await this.maintenanceRepository.save(maintenance);
  }

  async getMaintenanceCostByCar(carId: number): Promise<{ totalCost: number; maintenanceCount: number }> {
    const result = await this.maintenanceRepository
      .createQueryBuilder('maintenance')
      .select('SUM(maintenance.cost)', 'totalCost')
      .addSelect('COUNT(maintenance.id)', 'maintenanceCount')
      .where('maintenance.carId = :carId', { carId })
      .getRawOne();

    return {
      totalCost: parseFloat(result.totalCost) || 0,
      maintenanceCount: parseInt(result.maintenanceCount) || 0,
    };
  }
}