import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { ExceptionType } from './ExceptionType';
import { ParkingLot } from './ParkingLot';
import { ParkingSession } from './ParkingSession';
import { Payment } from './Payment';
import { Contract } from './Contract';

export type ExceptionCreatedBy = 'SYSTEM' | 'OPERATOR';
export type ExceptionStatus = 'OPEN' | 'RESOLVED' | 'ESCALATED';

@Table({
    tableName: 'exceptions',
    timestamps: false
})
export class Exception extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare id_exceptions: number;

    @Column({
        type: DataType.ENUM('SYSTEM', 'OPERATOR'),
        allowNull: false
    })
    declare created_by: ExceptionCreatedBy;

    @Column({
        type: DataType.DATE,
        allowNull: false
    })
    declare occurred_at: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true
    })
    declare resolved_at?: Date;

    @Column({
        type: DataType.ENUM('OPEN', 'RESOLVED', 'ESCALATED'),
        allowNull: false,
        defaultValue: 'OPEN'
    })
    declare status: ExceptionStatus;

    @Column({
        type: DataType.TEXT,
        allowNull: true
    })
    declare notes?: string;

    @Column({
        type: DataType.STRING(150),
        allowNull: true
    })
    declare evidence_url?: string;

    @Column({
        type: DataType.JSON,
        allowNull: true
    })
    declare metadata?: object;

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare id_users_reporter?: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare id_users_authorizer?: number;

    @ForeignKey(() => ExceptionType)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare id_exception_types: number;

    @BelongsTo(() => ExceptionType)
    declare exceptionType: ExceptionType;

    @ForeignKey(() => ParkingLot)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare id_parking_lots: number;

    @BelongsTo(() => ParkingLot)
    declare parkingLot: ParkingLot;

    @ForeignKey(() => ParkingSession)
    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare id_parking_sessions?: number;

    @BelongsTo(() => ParkingSession)
    declare parkingSession?: ParkingSession;

    @ForeignKey(() => Payment)
    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare id_payments?: number;

    @BelongsTo(() => Payment)
    declare payment?: Payment;

    @ForeignKey(() => Contract)
    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare id_contracts?: number;

    @BelongsTo(() => Contract)
    declare contract?: Contract;
}
