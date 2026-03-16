import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Payment } from './Payment';
import { User } from './User';

@Table({
    tableName: 'credit_notes',
    timestamps: false
})
export class CreditNote extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER.UNSIGNED)
    declare id_credit_notes: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare amount: number;

    @Column({
        type: DataType.STRING(100),
        allowNull: true
    })
    declare note?: string;

    @Column({
        type: DataType.DATE,
        allowNull: true
    })
    declare created_at?: Date;

    @Column({
        type: DataType.ENUM('PENDING', 'APPLIED', 'VOIDED'),
        allowNull: false,
        defaultValue: 'PENDING'
    })
    declare status: 'PENDING' | 'APPLIED' | 'VOIDED';

    @Column({
        type: DataType.ENUM('CASH', 'TRANSFER', 'OTHER'),
        allowNull: false
    })
    declare refund_method: 'CASH' | 'TRANSFER' | 'OTHER';

    @ForeignKey(() => Payment)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        field: 'id_payments_original'
    })
    declare id_payments_original: number;

    @BelongsTo(() => Payment, { foreignKey: 'id_payments_original', as: 'originalPayment' })
    declare originalPayment: Payment;

    @ForeignKey(() => Payment)
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        field: 'id_payments_new'
    })
    declare id_payments_new?: number;

    @BelongsTo(() => Payment, { foreignKey: 'id_payments_new', as: 'newPayment' })
    declare newPayment?: Payment;

    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare id_users: number;

    @BelongsTo(() => User)
    declare user: User;
}
