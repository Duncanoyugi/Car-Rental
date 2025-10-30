// src/reservation/dto/create-reservation.dto.ts
import { IsDateString, IsDecimal, IsEnum, IsNotEmpty, IsOptional, IsUUID, Min, MinDate } from 'class-validator';

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

export class CreateReservationDto {
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
  totalPrice: number;

  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: string;
}