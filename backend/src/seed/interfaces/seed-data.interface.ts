// src/seed/interfaces/seed-data.interface.ts
export interface ISeedUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  licenseNumber?: string;
  role: 'Admin' | 'manager' | 'driver' | 'customer';
}

export interface ISeedCar {
  model: string;
  make: string;
  year: number;
  color: string;
  rentalRate: number;
  isAvailable: boolean;
}

export interface ISeedLocation {
  LocationName: string;
  Address: string;
  ContactNumber?: string;
}

export interface ISeedInsurance {
  carId: number;
  provider: string;
  policyNumber: string;
  coverageType: string;
  startDate: string;
  endDate: string;
  premium: number;
}

export interface ISeedData {
  users: ISeedUser[];
  cars: ISeedCar[];
  locations: ISeedLocation[];
  insurance: ISeedInsurance[];
}