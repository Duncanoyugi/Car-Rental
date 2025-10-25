import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './entities/location.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  async create(createLocationDto: CreateLocationDto): Promise<Location> {
    // No mapping needed - DTO properties match entity properties
    const location = this.locationRepository.create(createLocationDto);
    return await this.locationRepository.save(location);
  }

  async findAll(): Promise<Location[]> {
    return await this.locationRepository.find();
  }

  async findOne(id: number): Promise<Location> {
    const location = await this.locationRepository.findOne({
      where: { LocationID: id },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    return location;
  }

  async update(id: number, updateLocationDto: UpdateLocationDto): Promise<Location> {
    const location = await this.findOne(id);
    
    // No mapping needed - DTO properties match entity properties
    Object.assign(location, updateLocationDto);
    
    return await this.locationRepository.save(location);
  }

  async remove(id: number): Promise<void> {
    const location = await this.findOne(id);
    await this.locationRepository.remove(location);
  }

  async findByName(locationName: string): Promise<Location[]> {
    return await this.locationRepository.find({
      where: { LocationName: locationName },
    });
  }

  async findByAddress(address: string): Promise<Location[]> {
    return await this.locationRepository.find({
      where: { Address: address },
    });
  }

  async searchLocations(searchTerm: string): Promise<Location[]> {
    return await this.locationRepository
      .createQueryBuilder('location')
      .where('location.LocationName LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('location.Address LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .getMany();
  }
}