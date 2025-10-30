import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne } from 'typeorm';
import { Rental } from '../../rental/entities/rental.entity';
import { Reservation } from '../../reservation/entities/reservation.entity';
import { Insurance } from '../../insurance/entities/insurance.entity';
import { Maintenance } from '../../maintenance/entities/maintenance.entity';

@Entity()
export class Car {
  @PrimaryGeneratedColumn()
  id: number; 

  @Column({ length: 100 })
  model: string; 

  @Column({ length: 50 })
  make: string;

  @Column()
  year: number;

  @Column({ length: 30, nullable: true })
  color: string; 

  @Column('decimal', { precision: 10, scale: 2 })
  rentalRate: number; 

  @Column({ type: 'bit', default: 1 })
  isAvailable: boolean; 

  @OneToMany(() => Rental, (rental) => rental.car) 
  rentals: Rental[]; 

  @OneToMany(() => Reservation, (reservation) => reservation.car)
  reservations: Reservation[]; 

  @OneToOne(() => Insurance, (insurance) => insurance.car) 
  insurance: Insurance; 

  @OneToMany(() => Maintenance, (maintenance) => maintenance.car) 
  maintenances: Maintenance[]; 
}