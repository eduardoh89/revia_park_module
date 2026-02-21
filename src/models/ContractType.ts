import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType } from 'sequelize-typescript';

@Table({
    tableName: 'contract_types',
    timestamps: false
})
export class ContractType extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare id_contract_types: number;

    @Column({
        type: DataType.STRING(4),
        allowNull: false
    })
    declare code: string;

    @Column({
        type: DataType.STRING(45),
        allowNull: false
    })
    declare name: string;

    @Column({
        type: DataType.STRING(60),
        allowNull: true
    })
    declare description: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare max_vehicle: string;

    @Column({
        type: DataType.TINYINT,
        allowNull: true
    })
    declare is_active: number;
}
