// src/location/location.service.ts
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Location } from './entities/location.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Not, IsNull } from 'typeorm';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  async create(createLocationDto: CreateLocationDto): Promise<Location> {
    // Check if location with same name already exists
    const existingLocation = await this.locationRepository.findOne({
      where: { LocationName: createLocationDto.LocationName }
    });

    if (existingLocation) {
      throw new ConflictException(`Location with name '${createLocationDto.LocationName}' already exists`);
    }

    // Check if location with same address already exists
    const existingAddress = await this.locationRepository.findOne({
      where: { Address: createLocationDto.Address }
    });

    if (existingAddress) {
      throw new ConflictException(`Location with address '${createLocationDto.Address}' already exists`);
    }

    const location = this.locationRepository.create(createLocationDto);
    return await this.locationRepository.save(location);
  }

  async findAll(): Promise<Location[]> {
    return await this.locationRepository.find({
      order: { LocationName: 'ASC' }
    });
  }

  async findActiveLocations(): Promise<Location[]> {
    // In a real scenario, you might want to check if locations have active rentals
    // For now, return all locations as active
    return await this.locationRepository.find({
      order: { LocationName: 'ASC' }
    });
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
    
    // Check for duplicate name if updating LocationName
    if (updateLocationDto.LocationName && updateLocationDto.LocationName !== location.LocationName) {
      const existingLocation = await this.locationRepository.findOne({
        where: { LocationName: updateLocationDto.LocationName }
      });

      if (existingLocation) {
        throw new ConflictException(`Location with name '${updateLocationDto.LocationName}' already exists`);
      }
    }

    // Check for duplicate address if updating Address
    if (updateLocationDto.Address && updateLocationDto.Address !== location.Address) {
      const existingAddress = await this.locationRepository.findOne({
        where: { Address: updateLocationDto.Address }
      });

      if (existingAddress) {
        throw new ConflictException(`Location with address '${updateLocationDto.Address}' already exists`);
      }
    }

    Object.assign(location, updateLocationDto);
    
    return await this.locationRepository.save(location);
  }

  async remove(id: number): Promise<void> {
    const location = await this.findOne(id);
    
    // In a real scenario, check if location has active rentals or reservations
    // For now, we'll allow deletion but log a warning
    console.warn(`Deleting location: ${location.LocationName}. Ensure no active rentals/reservations exist.`);
    
    await this.locationRepository.remove(location);
  }

  async findByName(locationName: string): Promise<Location[]> {
    return await this.locationRepository.find({
      where: { LocationName: ILike(`%${locationName}%`) },
      order: { LocationName: 'ASC' }
    });
  }

  async findByAddress(address: string): Promise<Location[]> {
    return await this.locationRepository.find({
      where: { Address: ILike(`%${address}%`) },
      order: { LocationName: 'ASC' }
    });
  }

  async searchLocations(searchTerm: string): Promise<Location[]> {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new BadRequestException('Search term must be at least 2 characters long');
    }

    return await this.locationRepository
      .createQueryBuilder('location')
      .where('location.LocationName ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('location.Address ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('location.ContactNumber ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orderBy('location.LocationName', 'ASC')
      .getMany();
  }

  async getLocationStats(): Promise<{
    totalLocations: number;
    locationsWithContact: number;
    popularLocations: { name: string; address: string; contact: string }[];
  }> {
    const totalLocations = await this.locationRepository.count();
    
    const locationsWithContact = await this.locationRepository.count({
      where: { ContactNumber: Not(IsNull()) }
    });

    // Get first 5 locations as "popular" (in real app, this would be based on rental data)
    const popularLocations = await this.locationRepository.find({
      take: 5,
      order: { LocationID: 'ASC' }
    });

    return {
      totalLocations,
      locationsWithContact,
      popularLocations: popularLocations.map(loc => ({
        name: loc.LocationName,
        address: loc.Address,
        contact: loc.ContactNumber || 'No contact'
      }))
    };
  }

  async validateLocationExists(id: number): Promise<boolean> {
    try {
      await this.findOne(id);
      return true;
    } catch {
      return false;
    }
  }

  async getLocationsByProximity(latitude: number, longitude: number, radiusKm: number = 10): Promise<Location[]> {
    // This is a simplified version - in a real app, you'd use geospatial queries
    // For now, return all locations with a note about proximity filtering
    const locations = await this.locationRepository.find({
      order: { LocationName: 'ASC' }
    });

    // Add a note about proximity (in real implementation, this would filter by distance)
    locations.forEach(loc => {
      (loc as any).proximityNote = 'Proximity filtering would be implemented with geospatial data';
    });

    return locations;
  }
}