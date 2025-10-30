import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateInsuranceDto {
  @IsNotEmpty()
  carId: string;

  @IsNotEmpty()
  @IsString()
  insuranceProvider: string;

  @IsNotEmpty()
  @IsString()
  policyNumber: string;

  @IsNotEmpty()
  @IsString()
  coverageType: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  premium: number;
}