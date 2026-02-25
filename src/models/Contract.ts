import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Company } from './Company';
import { ContractType } from './ContractType';
import { ParkingLot } from './ParkingLot';

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
}
