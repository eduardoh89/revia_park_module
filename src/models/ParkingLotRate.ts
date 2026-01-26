import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { ParkingLot } from './ParkingLot';
import { VehicleType } from './VehicleType';

@Table({
    tableName: 'parking_lot_rates',
    timestamps: false
})
export class ParkingLotRate extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id_parking_lot_rates!: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    rate_per_hour!: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    rate_per_minute?: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    min_amount?: number;

    @ForeignKey(() => ParkingLot)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    id_parking_lots!: number;

    @BelongsTo(() => ParkingLot)
    parkingLot!: ParkingLot;

    @ForeignKey(() => VehicleType)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    id_vehicle_types!: number;

    @BelongsTo(() => VehicleType)
    vehicleType!: VehicleType;
}
