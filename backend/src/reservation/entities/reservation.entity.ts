import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Car } from '../../car/entities/car.entity';
import { User } from '../../user/entities/user.entity'; // Changed from Customer

@Entity()
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Car, (car) => car.reservations)
  @JoinColumn({ name: 'carId' })
  car: Car;

  @ManyToOne(() => User, (user) => user.reservations) // Changed from Customer
  @JoinColumn({ name: 'userId' }) // Changed from customerId
  user: User; // Changed from customer

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;
}