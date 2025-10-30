import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Car } from '../../car/entities/car.entity';

@Entity()
export class Insurance {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Car, (car) => car.insurance) 
  @JoinColumn({ name: 'carId' })
  car: Car;

  @Column()
  provider: string;

  @Column()
  policyNumber: string;

  @Column()
  coverageType: string;

  @Column()
  expiryDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  premium: number;
}