import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Car } from '../../car/entities/car.entity';
import { Customer } from '../../customer/entities/customer.entity';
import { Payment } from '../../payment/entities/payment.entity'; // ADD THIS IMPORT

@Entity()
export class Rental {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Car, (car) => car.rentals) // lowercase
  @JoinColumn({ name: 'carId' })
  car: Car;

  @ManyToOne(() => Customer, (customer) => customer.rentals) // lowercase
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalCost: number;

  @Column({ default: 'active' })
  status: string;

  @OneToMany(() => Payment, (payment) => payment.rental) // ADD this relationship
  payments: Payment[]; // ADD this property
}