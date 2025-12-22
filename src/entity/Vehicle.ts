import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('vehicles')
@Index(['license_plate'], { unique: true })
export class Vehicle {
  @PrimaryGeneratedColumn()
  id_vehicles!: number;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true, // 👈 CLAVE
  })
  license_plate?: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;
}