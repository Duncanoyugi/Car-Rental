// src/maintenance/dto/create-maintenance.dto.ts
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum, Min, Max } from 'class-validator';
import { MinLength, MaxLength } from 'class-validator';

export enum MaintenanceStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum MaintenanceType {
  OIL_CHANGE = 'oil_change',
  TIRE_ROTATION = 'tire_rotation',
  BRAKE_SERVICE = 'brake_service',
  ENGINE_REPAIR = 'engine_repair',
  BODY_WORK = 'body_work',
  ELECTRICAL = 'electrical',
  PREVENTIVE = 'preventive',
  EMERGENCY = 'emergency'
}

export class CreateMaintenanceDto {
  @IsNotEmpty()
  carId: string;

  @IsNotEmpty()
  @IsEnum(MaintenanceType)
  maintenanceType: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  description: string;

  @IsDateString()
  @IsNotEmpty()
  maintenanceDate: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(10000)
  cost: number;

  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: string;
}