import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne } from 'typeorm';
import { Rental } from '../../rental/entities/rental.entity'; // FIXED PATH
import { Reservation } from '../../reservation/entities/reservation.entity'; // FIXED PATH
import { Insurance } from '../../insurance/entities/insurance.entity'; // FIXED PATH
import { Maintenance } from '../../maintenance/entities/maintenance.entity'; // FIXED PATH

@Entity()
export class Car {
  @PrimaryGeneratedColumn()
  id: number; // Changed from CarID to id for consistency

  @Column({ length: 100 })
  model: string; // Changed from CarModel to model

  @Column({ length: 50 })
  make: string; // Changed from Manufacturer to make

  @Column()
  year: number;

  @Column({ length: 30, nullable: true })
  color: string; // lowercase

  @Column('decimal', { precision: 10, scale: 2 })
  rentalRate: number; // camelCase

  @Column({ type: 'bit', default: 1 })
  isAvailable: boolean; // Changed from Availability to isAvailable

  @OneToMany(() => Rental, (rental) => rental.car) // lowercase
  rentals: Rental[]; // lowercase

  @OneToMany(() => Reservation, (reservation) => reservation.car) // lowercase
  reservations: Reservation[]; // lowercase

  @OneToOne(() => Insurance, (insurance) => insurance.car) // lowercase
  insurance: Insurance; // lowercase

  @OneToMany(() => Maintenance, (maintenance) => maintenance.car) // lowercase
  maintenances: Maintenance[]; // lowercase
}