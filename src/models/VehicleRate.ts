import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { VehicleType } from './VehicleType';
import { VehicleRateConfig } from './VehicleRateConfig';

@Table({
    tableName: 'vehicle_rates',
    timestamps: false
})
export class VehicleRate extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare id_vehicle_rates: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare price_per_minute: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare daily_limit: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare block_duration_min: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare price_per_block: number;

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

    @ForeignKey(() => VehicleType)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare id_vehicle_types: number;

    @BelongsTo(() => VehicleType)
    declare vehicleType: VehicleType;

    @ForeignKey(() => VehicleRateConfig)
    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare id_vehicle_rate_configs: number;

    @BelongsTo(() => VehicleRateConfig)
    declare vehicleRateConfig: VehicleRateConfig;
}
