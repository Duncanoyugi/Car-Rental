// src/car/dto/create-car.dto.ts
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class CreateCarDto {
  @IsNotEmpty()
  @IsString()
  carModel: string;

  @IsNotEmpty()
  @IsString()
  manufacturer: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  rentalRate: number;

  @IsOptional()
  @IsBoolean()
  availability?: boolean;
}