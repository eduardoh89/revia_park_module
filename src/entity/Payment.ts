import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { ParkingSession } from "./ParkingSession";

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'REJECTED';

@Entity("payments")
export class Payment {
    @PrimaryGeneratedColumn()
    id_payments!: number;

    @Column({ unique: true })
    order_id!: string;

    @Column()
    reference_id!: string;

    @Column()
    amount!: number;

    @Column({
        type: "enum",
        enum: ['PENDING', 'COMPLETED', 'REJECTED'],
        default: 'PENDING'
    })
    status!: PaymentStatus;

    @Column({ nullable: true })
    mc_code!: string;

    @CreateDateColumn()
    created_at!: Date;

    @Column({ nullable: true })
    completed_at!: Date;

    @Column()
    id_parking_sessions!: number;

    @ManyToOne(() => ParkingSession)
    @JoinColumn({ name: "id_parking_sessions" })
    parkingSession!: ParkingSession;
}
