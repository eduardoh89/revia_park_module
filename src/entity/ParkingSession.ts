import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Vehicle } from "./Vehicle";
import { ParkingLot } from "./ParkingLot";

export type SessionStatus = 'PARKED' | 'PAID' | 'EXPIRED';

@Entity("parking_sessions")
export class ParkingSession {
    @PrimaryGeneratedColumn()
    id_parking_sessions!: number;

    @Column()
    arrival_time!: Date;

    @Column({ nullable: true })
    exit_time!: Date;

    @Column({
        type: "enum",
        enum: ['PARKED', 'PAID', 'EXPIRED'],
        default: 'PARKED'
    })
    status!: SessionStatus;

    @Column()
    id_vehicles!: number;

    @ManyToOne(() => Vehicle)
    @JoinColumn({ name: "id_vehicles" })
    vehicle!: Vehicle;

    @Column()
    id_parking_lots!: number;

    @ManyToOne(() => ParkingLot)
    @JoinColumn({ name: "id_parking_lots" })
    parkingLot!: ParkingLot;
}
