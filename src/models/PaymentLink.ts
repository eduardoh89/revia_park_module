import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Payment } from './Payment';

@Table({
    tableName: 'payment_links',
    timestamps: false
})
export class PaymentLink extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare id_payment_links: number;

    @Column({
        type: DataType.STRING(100),
        allowNull: false
    })
    declare order_id: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: false
    })
    declare reference_id: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: true
    })
    declare mc_code?: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: false
    })
    declare link_code: string;

    @Column({
        type: DataType.TINYINT,
        allowNull: false
    })
    declare is_used: number;

    @Column({
        type: DataType.DATE,
        allowNull: true
    })
    declare expires_at?: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true,
        field: 'created_at'
    })
    declare created_at?: Date;

    @ForeignKey(() => Payment)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare id_payments: number;

    @BelongsTo(() => Payment)
    declare payment: Payment;

    isExpired(): boolean {
        if (!this.expires_at) return true;
        return new Date() > this.expires_at;
    }

    isValid(): boolean {
        return !this.is_used && !this.isExpired();
    }
}
