import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRentalDto {
  @IsNotEmpty()
  @IsString()
  carId: string;

  @IsNotEmpty()
  @IsString()
  customerId: string;

  @IsDateString()
  startDate: string; // Changed from rentalStartDate to startDate

  @IsDateString()
  endDate: string; // Changed from rentalEndDate to endDate

  @IsNotEmpty()
  @IsNumber()
  totalCost: number; // Changed from totalAmount to totalCost

  @IsOptional()
  @IsString()
  status?: string; // Added this field to match entity (with default)
}