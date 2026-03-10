import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { Company } from './Company';
import { ContractType } from './ContractType';
import { ContractRate } from './ContractRate';
import { ParkingLot } from './ParkingLot';
import { User } from './User';
import { ContractVehicle } from './ContractVehicle';

@Table({
    tableName: 'contracts',
    timestamps: false
})
export class Contract extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare id_contracts: number;

    @Column({
        type: DataType.DATEONLY,
        allowNull: false
    })
    declare start_date: string;

    @Column({
        type: DataType.DATEONLY,
        allowNull: false
    })
    declare end_date: string;

    @Column({
        type: DataType.TINYINT,
        allowNull: false
    })
    declare status: number;

    @Column({
        type: DataType.STRING(90),
        allowNull: true
    })
    declare notes?: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare final_price?: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare max_vehicle: number;

    @ForeignKey(() => Company)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare id_companies: number;

    @BelongsTo(() => Company)
    declare company: Company;

    @ForeignKey(() => ContractType)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare id_contract_types: number;

    @BelongsTo(() => ContractType)
    declare contractType: ContractType;

    @ForeignKey(() => ParkingLot)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare id_parking_lots: number;

    @BelongsTo(() => ParkingLot)
    declare parkingLot: ParkingLot;

    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare id_users?: number;

    @BelongsTo(() => User)
    declare user?: User;

    @ForeignKey(() => ContractRate)
    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare id_contract_rates?: number;

    @BelongsTo(() => ContractRate)
    declare contractRate?: ContractRate;

    @HasMany(() => ContractVehicle)
    declare contractVehicles: ContractVehicle[];
}
