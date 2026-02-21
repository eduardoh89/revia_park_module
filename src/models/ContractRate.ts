import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { ContractType } from './ContractType';
import { ContractRateConfig } from './ContractRateConfig';

@Table({
    tableName: 'contract_rates',
    timestamps: false
})
export class ContractRate extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare id_contract_rates: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare month_amount: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare exit_charge: number;

    @Column({
        type: DataType.TINYINT,
        allowNull: true
    })
    declare is_active: number;

    @Column({
        type: DataType.DATEONLY,
        allowNull: false
    })
    declare start_date: string;

    @Column({
        type: DataType.DATEONLY,
        allowNull: true
    })
    declare end_date: string;

    @ForeignKey(() => ContractType)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare id_contract_types: number;

    @BelongsTo(() => ContractType)
    declare contractType: ContractType;

    @ForeignKey(() => ContractRateConfig)
    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare id_contract_rate_configs: number;

    @BelongsTo(() => ContractRateConfig)
    declare contractRateConfig: ContractRateConfig;
}
