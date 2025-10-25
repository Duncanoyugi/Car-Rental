import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateReservationDto {
  @IsNotEmpty()
  @IsString()
  carId: string;

  @IsNotEmpty()
  @IsString()
  customerId: string;

  @IsDateString()
  startDate: string; // Changed from reservationDate/pickupDate to startDate

  @IsDateString()
  endDate: string; // Changed from returnDate to endDate

  @IsNotEmpty()
  @IsNumber()
  totalPrice: number; // Added this field to match entity

  @IsOptional()
  @IsString()
  status?: string; // Added this field to match entity (with default)
}