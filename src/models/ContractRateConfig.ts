import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType } from 'sequelize-typescript';

@Table({
    tableName: 'contract_rate_configs',
    timestamps: false
})
export class ContractRateConfig extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER.UNSIGNED)
    declare id_contract_rate_configs: number;

    @Column({
        type: DataType.STRING(45),
        allowNull: false
    })
    declare name: string;

    @Column({
        type: DataType.STRING(60),
        allowNull: false
    })
    declare fields: string;

    @Column({
        type: DataType.TEXT('medium'),
        allowNull: false
    })
    declare description: string;
}
