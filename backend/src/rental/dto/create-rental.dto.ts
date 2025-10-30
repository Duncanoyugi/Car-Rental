// src/rental/dto/create-rental.dto.ts
import { IsDateString, IsDecimal, IsEnum, IsNotEmpty, IsOptional, IsUUID, Min, MinDate } from 'class-validator';

export enum RentalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue'
}

export class CreateRentalDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  carId: number;

  @IsDateString()
  @IsNotEmpty()
  @MinDate(new Date(), { message: 'Start date cannot be in the past' })
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  @MinDate(new Date(), { message: 'End date cannot be in the past' })
  endDate: string;

  @IsDecimal()
  @IsNotEmpty()
  @Min(0)
  totalCost: number;

  @IsOptional()
  @IsEnum(RentalStatus)
  status?: string;
}