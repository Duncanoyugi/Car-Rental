import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Rental } from '../../rental/entities/rental.entity'; // FIXED PATH

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number; // Changed from PaymentID to id

  @ManyToOne(() => Rental, (rental) => rental.payments) // lowercase
  @JoinColumn({ name: 'rentalId' })
  rental: Rental; // lowercase

  @Column({ type: 'date' })
  paymentDate: Date; // camelCase

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number; // lowercase

  @Column({ length: 50 })
  paymentMethod: string; // camelCase
}