// src/maintenance/maintenance.service.ts
import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Maintenance } from './entities/maintenance.entity';
import { Car } from '../car/entities/car.entity';
import { CreateMaintenanceDto, MaintenanceStatus, MaintenanceType } from './dto/create-maintenance.dto';
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
    const car = await this.carRepository.findOne({
      where: { id: +createMaintenanceDto.carId },
    });

    if (!car) {
      throw new NotFoundException(`Car with ID ${createMaintenanceDto.carId} not found`);
    }

    // Validate maintenance date
    const maintenanceDate = new Date(createMaintenanceDto.maintenanceDate);
    if (maintenanceDate < new Date()) {
      throw new BadRequestException('Maintenance date cannot be in the past');
    }

    // Check for conflicting maintenance on the same car and date
    const conflictingMaintenance = await this.maintenanceRepository.findOne({
      where: {
        car: { id: +createMaintenanceDto.carId },
        maintenanceDate: Between(
          new Date(maintenanceDate.getTime() - 2 * 60 * 60 * 1000), // 2 hours before
          new Date(maintenanceDate.getTime() + 2 * 60 * 60 * 1000)  // 2 hours after
        ),
        status: MaintenanceStatus.SCHEDULED
      }
    });

    if (conflictingMaintenance) {
      throw new ConflictException('Car already has scheduled maintenance around this time');
    }

    const maintenanceData = {
      maintenanceType: createMaintenanceDto.maintenanceType,
      description: createMaintenanceDto.description,
      maintenanceDate: maintenanceDate,
      cost: createMaintenanceDto.cost,
      status: createMaintenanceDto.status || MaintenanceStatus.SCHEDULED,
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

  async findActiveMaintenance(): Promise<Maintenance[]> {
    return await this.maintenanceRepository.find({
      where: { 
        status: MaintenanceStatus.IN_PROGRESS 
      },
      relations: ['car'],
      order: { maintenanceDate: 'ASC' },
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

    // If updating car, validate new car exists
    if (updateMaintenanceDto.carId && +updateMaintenanceDto.carId !== maintenance.car.id) {
      const newCar = await this.carRepository.findOne({
        where: { id: +updateMaintenanceDto.carId },
      });

      if (!newCar) {
        throw new NotFoundException(`Car with ID ${updateMaintenanceDto.carId} not found`);
      }

      maintenance.car = newCar;
    }

    // Validate maintenance date if updating
    if (updateMaintenanceDto.maintenanceDate !== undefined) {
      const newDate = new Date(updateMaintenanceDto.maintenanceDate);
      if (newDate < new Date()) {
        throw new BadRequestException('Maintenance date cannot be in the past');
      }
      maintenance.maintenanceDate = newDate;
    }

    // Update other fields
    if (updateMaintenanceDto.maintenanceType !== undefined) {
      maintenance.maintenanceType = updateMaintenanceDto.maintenanceType;
    }
    if (updateMaintenanceDto.description !== undefined) {
      maintenance.description = updateMaintenanceDto.description;
    }
    if (updateMaintenanceDto.cost !== undefined) {
      maintenance.cost = updateMaintenanceDto.cost;
    }
    if (updateMaintenanceDto.status !== undefined) {
      maintenance.status = updateMaintenanceDto.status;

      // If marking as completed, update car availability
      if (updateMaintenanceDto.status === MaintenanceStatus.COMPLETED && maintenance.car) {
        maintenance.car.isAvailable = true;
        await this.carRepository.save(maintenance.car);
      }
    }

    return await this.maintenanceRepository.save(maintenance);
  }

  async remove(id: number): Promise<void> {
    const maintenance = await this.findOne(id);
    
    // Prevent deletion of in-progress or completed maintenance
    if (maintenance.status === MaintenanceStatus.IN_PROGRESS) {
      throw new BadRequestException('Cannot delete maintenance that is in progress');
    }

    if (maintenance.status === MaintenanceStatus.COMPLETED) {
      throw new BadRequestException('Cannot delete completed maintenance records');
    }

    await this.maintenanceRepository.remove(maintenance);
  }

  async findByStatus(status: MaintenanceStatus): Promise<Maintenance[]> {
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
      .andWhere('maintenance.status = :status', { status: MaintenanceStatus.SCHEDULED })
      .leftJoinAndSelect('maintenance.car', 'car')
      .orderBy('maintenance.maintenanceDate', 'ASC')
      .getMany();
  }

  async getOverdueMaintenance(): Promise<Maintenance[]> {
    return await this.maintenanceRepository
      .createQueryBuilder('maintenance')
      .where('maintenance.maintenanceDate < :today', { today: new Date() })
      .andWhere('maintenance.status = :status', { status: MaintenanceStatus.SCHEDULED })
      .leftJoinAndSelect('maintenance.car', 'car')
      .orderBy('maintenance.maintenanceDate', 'ASC')
      .getMany();
  }

  async updateStatus(id: number, status: MaintenanceStatus): Promise<Maintenance> {
    const maintenance = await this.findOne(id);
    
    // Validate status transition
    if (maintenance.status === MaintenanceStatus.COMPLETED && status !== MaintenanceStatus.COMPLETED) {
      throw new BadRequestException('Cannot change status from completed');
    }

    maintenance.status = status;

    // Update car availability when maintenance is completed
    if (status === MaintenanceStatus.COMPLETED && maintenance.car) {
      maintenance.car.isAvailable = true;
      await this.carRepository.save(maintenance.car);
    }

    // Make car unavailable when maintenance starts
    if (status === MaintenanceStatus.IN_PROGRESS && maintenance.car) {
      maintenance.car.isAvailable = false;
      await this.carRepository.save(maintenance.car);
    }

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

  async getMaintenanceStats(): Promise<{
    totalMaintenance: number;
    scheduled: number;
    inProgress: number;
    completed: number;
    totalCost: number;
    averageCost: number;
  }> {
    const [total, scheduled, inProgress, completed] = await Promise.all([
      this.maintenanceRepository.count(),
      this.maintenanceRepository.count({ where: { status: MaintenanceStatus.SCHEDULED } }),
      this.maintenanceRepository.count({ where: { status: MaintenanceStatus.IN_PROGRESS } }),
      this.maintenanceRepository.count({ where: { status: MaintenanceStatus.COMPLETED } }),
    ]);

    const costResult = await this.maintenanceRepository
      .createQueryBuilder('maintenance')
      .select('SUM(maintenance.cost)', 'totalCost')
      .addSelect('AVG(maintenance.cost)', 'averageCost')
      .getRawOne();

    return {
      totalMaintenance: total,
      scheduled,
      inProgress,
      completed,
      totalCost: parseFloat(costResult.totalCost) || 0,
      averageCost: parseFloat(costResult.averageCost) || 0,
    };
  }

  async getMaintenanceByType(): Promise<{ type: string; count: number; totalCost: number }[]> {
    const result = await this.maintenanceRepository
      .createQueryBuilder('maintenance')
      .select('maintenance.maintenanceType', 'type')
      .addSelect('COUNT(maintenance.id)', 'count')
      .addSelect('SUM(maintenance.cost)', 'totalCost')
      .groupBy('maintenance.maintenanceType')
      .getRawMany();

    return result.map(item => ({
      type: item.type,
      count: parseInt(item.count),
      totalCost: parseFloat(item.totalCost) || 0
    }));
  }
}