import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMaintenanceDto {
  @IsNotEmpty()
  @IsString()
  carId: string;

  @IsNotEmpty()
  @IsString()
  maintenanceType: string; // Added this field to match entity

  @IsNotEmpty()
  @IsString()
  description: string; // Changed from optional to required to match entity

  @IsDateString()
  maintenanceDate: string;

  @IsNotEmpty()
  @IsNumber()
  cost: number;

  @IsOptional()
  @IsString()
  status?: string; // Added this field to match entity (with default)
}