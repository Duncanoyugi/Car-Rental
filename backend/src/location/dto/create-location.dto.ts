import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLocationDto {
  @IsNotEmpty()
  @IsString()
  LocationName: string; // Changed from locationName to LocationName

  @IsNotEmpty()
  @IsString()
  Address: string; // Changed from address to Address

  @IsOptional()
  @IsString()
  ContactNumber?: string; // Changed from contactNumber to ContactNumber (and made optional)
}