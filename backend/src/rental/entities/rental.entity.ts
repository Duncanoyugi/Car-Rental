import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Car } from '../../car/entities/car.entity';
import { User } from '../../user/entities/user.entity'; // Changed from Customer
import { Payment } from '../../payment/entities/payment.entity';

@Entity()
export class Rental {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Car, (car) => car.rentals)
  @JoinColumn({ name: 'carId' })
  car: Car;

  @ManyToOne(() => User, (user) => user.rentals) // Changed from Customer
  @JoinColumn({ name: 'userId' }) // Changed from customerId
  user: User; // Changed from customer

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalCost: number;

  @Column({ default: 'active' })
  status: string;

  @OneToMany(() => Payment, (payment) => payment.rental)
  payments: Payment[];
}