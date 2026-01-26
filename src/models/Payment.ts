import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType, ForeignKey, BelongsTo, CreatedAt } from 'sequelize-typescript';
import { ParkingSession } from './ParkingSession';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'REJECTED';

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
        type: DataType.STRING,
        allowNull: false,
        unique: true
    })
    declare order_id: string;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare reference_id: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare amount: number;

    @Column({
        type: DataType.ENUM('PENDING', 'COMPLETED', 'REJECTED'),
        defaultValue: 'PENDING',
        allowNull: false
    })
    declare status: PaymentStatus;

    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    declare mc_code?: string;

    @CreatedAt
    @Column({
        type: DataType.DATE,
        field: 'created_at'
    })
    declare created_at: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true
    })
    declare completed_at?: Date;

    // Campos de payment_links (migrados a payments)
    @Column({
        type: DataType.STRING(100),
        allowNull: true,
        unique: true,
        comment: 'Código único para el link de pago (UUID)'
    })
    declare link_code?: string;

    @Column({
        type: DataType.BOOLEAN,
        defaultValue: false,
        allowNull: true,
        field: 'link_is_used',
        comment: 'Indica si el link ya fue usado'
    })
    declare link_is_used?: boolean;

    @Column({
        type: DataType.DATE,
        allowNull: true,
        field: 'link_expires_at',
        comment: 'Fecha y hora de expiración del link (5 minutos desde creación)'
    })
    declare link_expires_at?: Date;

    @ForeignKey(() => ParkingSession)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare id_parking_sessions: number;

    @BelongsTo(() => ParkingSession)
    declare parkingSession: ParkingSession;

    /**
     * Verifica si el link está expirado
     */
    isLinkExpired(): boolean {
        if (!this.link_expires_at) return true;
        return new Date() > this.link_expires_at;
    }

    /**
     * Verifica si el link es válido (no usado y no expirado)
     */
    isLinkValid(): boolean {
        if (!this.link_code) return false;
        return !this.link_is_used && !this.isLinkExpired();
    }
}
