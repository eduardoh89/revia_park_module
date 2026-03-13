import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Payment } from './Payment';

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

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare id_users?: number;
}
