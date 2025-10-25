import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Rental } from '../../rental/entities/rental.entity'; // FIXED PATH
import { Reservation } from '../../reservation/entities/reservation.entity'; // FIXED PATH

@Entity()
export class Customer {
  @PrimaryGeneratedColumn()
  id: number; // Changed from CustomerID to id

  @Column({ length: 50 })
  firstName: string; // camelCase

  @Column({ length: 50 })
  lastName: string; // camelCase

  @Column({ length: 100, unique: true })
  email: string; // lowercase

  @Column({ length: 15, nullable: true })
  phone: string; // Changed from PhoneNumber to phone

  @Column({ length: 255, nullable: true })
  address: string; // lowercase

  @OneToMany(() => Rental, (rental) => rental.customer) // lowercase
  rentals: Rental[]; // lowercase

  @OneToMany(() => Reservation, (reservation) => reservation.customer) // lowercase
  reservations: Reservation[]; // lowercase
}