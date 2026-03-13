import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Contract } from './Contract';
import { Vehicle } from './Vehicle';

@Table({
    tableName: 'contract_vehicles',
    timestamps: false
})
export class ContractVehicle extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare id_contract_vehicles: number;

    @Column({
        type: DataType.TINYINT,
        allowNull: true
    })
    declare is_active: number;

    @ForeignKey(() => Vehicle)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare id_vehicles: number;

    @BelongsTo(() => Vehicle)
    declare vehicle: Vehicle;

    @ForeignKey(() => Contract)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare id_contracts: number;

    @BelongsTo(() => Contract)
    declare contract: Contract;
}
