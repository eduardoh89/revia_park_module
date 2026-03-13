import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType } from 'sequelize-typescript';

@Table({
    tableName: 'payment_methods',
    timestamps: false
})
export class PaymentMethod extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare id_payment_methods: number;

    @Column({
        type: DataType.STRING(20),
        allowNull: true
    })
    declare code?: string;

    @Column({
        type: DataType.STRING(45),
        allowNull: false
    })
    declare name: string;

    @Column({
        type: DataType.TINYINT,
        allowNull: true
    })
    declare is_active?: number;
}
