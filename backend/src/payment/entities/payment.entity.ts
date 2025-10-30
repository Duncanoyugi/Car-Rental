import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Rental } from '../../rental/entities/rental.entity'; 

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number; 

  @ManyToOne(() => Rental, (rental) => rental.payments) 
  @JoinColumn({ name: 'rentalId' })
  rental: Rental;

  @Column({ type: 'date' })
  paymentDate: Date; 

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number; 

  @Column({ length: 50 })
  paymentMethod: string; 
}