import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Vehicle } from './Vehicle';
import { ParkingLot } from './ParkingLot';

export type SessionStatus = 'PARKED' | 'PAID' | 'EXPIRED';

@Table({
    tableName: 'parking_sessions',
    timestamps: false
})
export class ParkingSession extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare id_parking_sessions: number;

    @Column({
        type: DataType.DATE,
        allowNull: false
    })
    declare arrival_time: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true
    })
    declare exit_time?: Date;

    @Column({
        type: DataType.ENUM('PARKED', 'PAID', 'EXPIRED'),
        defaultValue: 'PARKED',
        allowNull: false
    })
    declare status: SessionStatus;

    @ForeignKey(() => Vehicle)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare id_vehicles: number;

    @BelongsTo(() => Vehicle)
    declare vehicle: Vehicle;

    @ForeignKey(() => ParkingLot)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare id_parking_lots: number;

    @BelongsTo(() => ParkingLot)
    declare parkingLot: ParkingLot;
}
