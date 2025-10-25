import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Location {
  @PrimaryGeneratedColumn()
  LocationID: number;

  @Column({ length: 100 })
  LocationName: string;

  @Column({ length: 255 })
  Address: string;

  @Column({ length: 15, nullable: true })
  ContactNumber: string;
}
