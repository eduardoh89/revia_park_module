import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType, ForeignKey, BelongsTo, HasMany, CreatedAt } from 'sequelize-typescript';
import { VehicleType } from './VehicleType';
import { ContractVehicle } from './ContractVehicle';

@Table({
    tableName: 'vehicles',
    timestamps: false
})
export class Vehicle extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare id_vehicles: number;

    @Column({
        type: DataType.STRING(20),
        allowNull: true,
        unique: true
    })
    declare license_plate?: string;

    @CreatedAt
    @Column({
        type: DataType.DATE,
        field: 'created_at'
    })
    declare created_at: Date;

    @Column({
        type: DataType.STRING(100),
        allowNull: true
    })
    declare url_foto?: string;

    @ForeignKey(() => VehicleType)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare id_vehicle_types: number;

    @BelongsTo(() => VehicleType)
    declare vehicleType: VehicleType;

    @HasMany(() => ContractVehicle)
    declare contractVehicles: ContractVehicle[];
}
