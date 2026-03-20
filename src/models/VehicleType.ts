import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType, HasMany } from 'sequelize-typescript';
import { VehicleRate } from './VehicleRate';

@Table({
    tableName: 'vehicle_types',
    timestamps: false
})
export class VehicleType extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare id_vehicle_types: number;

    @Column({
        type: DataType.STRING(4),
        allowNull: true
    })
    declare code?: string;

    @Column({
        type: DataType.STRING(45),
        allowNull: false
    })
    declare name: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true
    })
    declare description?: string;

    @Column({
        type: DataType.TINYINT,
        allowNull: false,
        defaultValue: 0
    })
    declare not_delete: number;

    @HasMany(() => VehicleRate)
    declare vehicleRates: VehicleRate[];
}
