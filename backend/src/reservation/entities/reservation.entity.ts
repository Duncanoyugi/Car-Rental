import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Car } from '../../car/entities/car.entity';
import { Customer } from '../../customer/entities/customer.entity';

@Entity()
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Car, (car) => car.reservations) // Changed from car.Reservations to car.reservations
  @JoinColumn({ name: 'carId' })
  car: Car;

  @ManyToOne(() => Customer, (customer) => customer.reservations) // Changed from customer.Reservations to customer.reservations
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;
}