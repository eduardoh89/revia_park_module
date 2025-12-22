import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("parking_lots")
export class ParkingLot {
    @PrimaryGeneratedColumn()
    id_parking_lots!: number;

    @Column()
    name!: string;

    @Column({ nullable: true })
    address!: string;

    @Column({ nullable: true })
    phone!: string;

    @Column({ nullable: true })
    email!: string;

    @Column()
    rate_per_hour!: number;

    @Column({ nullable: true })
    rate_per_minute!: number;

    @Column({ nullable: true })
    min_amount!: number;
}
