import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Vehicle } from './Vehicle';
import { ParkingLot } from './ParkingLot';
import { Contract } from './Contract';

export type SessionStatus = 'PARKED' | 'EXITED_PAID' | 'EXITED_CONTRACT' | 'EXITED_EXCEPTION' | 'TRAILER_WAITING';

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
        allowNull: true
    })
    declare arrival_time?: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true
    })
    declare exit_time?: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true
    })
    declare pay_time?: Date;

    @Column({
        type: DataType.ENUM('PARKED', 'EXITED_PAID', 'EXITED_CONTRACT', 'EXITED_EXCEPTION', 'TRAILER_WAITING'),
        allowNull: true
    })
    declare status?: SessionStatus;

    @Column({
        type: DataType.TINYINT,
        allowNull: false,
        defaultValue: 0
    })
    declare has_trailer_entry: number;

    @Column({
        type: DataType.TINYINT,
        allowNull: false,
        defaultValue: 0
    })
    declare has_trailer_exit: number;

    @ForeignKey(() => ParkingLot)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare id_parking_lots: number;

    @BelongsTo(() => ParkingLot)
    declare parkingLot: ParkingLot;

    @ForeignKey(() => Vehicle)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare id_vehicles: number;

    @BelongsTo(() => Vehicle, { foreignKey: 'id_vehicles', as: 'vehicle' })
    declare vehicle: Vehicle;

    @ForeignKey(() => Vehicle)
    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare id_trailer?: number;

    @BelongsTo(() => Vehicle, { foreignKey: 'id_trailer', as: 'trailer' })
    declare trailer?: Vehicle;

    @ForeignKey(() => Contract)
    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare id_contracts?: number;

    @BelongsTo(() => Contract)
    declare contract?: Contract;
}
