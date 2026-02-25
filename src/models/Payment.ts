import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { ParkingSession } from './ParkingSession';
import { PaymentMethod } from './PaymentMethod';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'REJECTED' | 'VOIDED';

@Table({
    tableName: 'payments',
    timestamps: false
})
export class Payment extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare id_payments: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare amount: number;

    @Column({
        type: DataType.STRING(100),
        allowNull: false
    })
    declare order_id: string;

    @Column({
        type: DataType.ENUM('PENDING', 'COMPLETED', 'REJECTED', 'VOIDED'),
        defaultValue: 'PENDING',
        allowNull: false
    })
    declare status: PaymentStatus;

    @Column({
        type: DataType.STRING(50),
        allowNull: true
    })
    declare mc_code?: string;

    @Column({
        type: DataType.DATE,
        allowNull: true,
        field: 'created_at'
    })
    declare created_at?: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true
    })
    declare completed_at?: Date;

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare id_users?: number;

    @ForeignKey(() => ParkingSession)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare id_parking_sessions: number;

    @BelongsTo(() => ParkingSession)
    declare parkingSession: ParkingSession;

    @ForeignKey(() => PaymentMethod)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare id_payment_methods: number;

    @BelongsTo(() => PaymentMethod)
    declare paymentMethod: PaymentMethod;
}
