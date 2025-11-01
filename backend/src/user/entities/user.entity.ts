// src/user/entities/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate, OneToMany, Check } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Rental } from '../../rental/entities/rental.entity';
import { Reservation } from '../../reservation/entities/reservation.entity';


export enum UserRole {
  SUPER_ADMIN = 'Admin',
  MANAGER = 'manager',
  DRIVER = 'driver',
  CUSTOMER = 'customer'
}

@Entity('users')
 @Check(`"role" IN ('Admin', 'manager', 'driver', 'customer')`)
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;
  @Column({
    type: 'nvarchar',
    length: 50,
    default: UserRole.CUSTOMER
  })
  role: UserRole;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  licenseNumber: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  refreshToken?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Rental, (rental) => rental.user)
  rentals: Rental[];

  @OneToMany(() => Reservation, (reservation) => reservation.user)
  reservations: Reservation[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword?() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}