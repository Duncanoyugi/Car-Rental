import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Car } from './entities/car.entity';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';

@Injectable()
export class CarService {
  constructor(
    @InjectRepository(Car)
    private readonly carRepository: Repository<Car>,
  ) {}

  async create(createCarDto: CreateCarDto): Promise<Car> {
    // Debug: log the incoming DTO
    console.log('Creating car with DTO:', createCarDto);
    
    // Map DTO properties to entity properties
    const carData = {
      model: createCarDto.carModel,        // Map carModel → model
      make: createCarDto.manufacturer,     // Map manufacturer → make
      year: createCarDto.year,
      color: createCarDto.color,
      rentalRate: createCarDto.rentalRate,
      isAvailable: createCarDto.availability ?? true,
    };

    console.log('Mapped car data:', carData);

    const car = this.carRepository.create(carData);
    return await this.carRepository.save(car);
  }

  async findAll(): Promise<Car[]> {
    return await this.carRepository.find({
      relations: ['rentals', 'reservations', 'maintenances', 'insurance'],
    });
  }

  async findAvailable(): Promise<Car[]> {
    return await this.carRepository.find({
      where: { isAvailable: true },
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
    
    // Map DTO properties to entity properties
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
    });
  }
}