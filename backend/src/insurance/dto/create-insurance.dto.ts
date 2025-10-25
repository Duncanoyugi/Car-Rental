import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateInsuranceDto {
  @IsNotEmpty()
  @IsString()
  carId: string;

  @IsNotEmpty()
  @IsString()
  insuranceProvider: string; // This is the original property name

  @IsNotEmpty()
  @IsString()
  policyNumber: string;

  @IsDateString()
  startDate: string; // This is the original property name

  @IsDateString()
  endDate: string; // This is the original property name
}