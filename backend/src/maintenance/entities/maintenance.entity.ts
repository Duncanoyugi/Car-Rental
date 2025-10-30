import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Car } from '../../car/entities/car.entity';

@Entity()
export class Maintenance {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Car, (car) => car.maintenances) 
  @JoinColumn({ name: 'carId' })
  car: Car;

  @Column()
  maintenanceType: string;

  @Column()
  description: string;

  @Column()
  maintenanceDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cost: number;

  @Column({ default: 'scheduled' })
  status: string;
}