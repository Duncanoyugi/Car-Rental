// src/location/dto/create-location.dto.ts
import { IsNotEmpty, IsOptional, IsString, IsPhoneNumber, MaxLength, MinLength } from 'class-validator';

export class CreateLocationDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  LocationName: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  Address: string;

  @IsOptional()
  @IsString()
  @IsPhoneNumber() // Validates phone number format
  ContactNumber?: string;
}