import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType, ForeignKey, BelongsTo, CreatedAt } from 'sequelize-typescript';
import { VehicleType } from './VehicleType';

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

    @ForeignKey(() => VehicleType)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare id_vehicle_types: number;

    @BelongsTo(() => VehicleType)
    declare vehicleType: VehicleType;
}
