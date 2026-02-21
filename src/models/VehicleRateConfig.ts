import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType } from 'sequelize-typescript';

@Table({
    tableName: 'vehicle_rate_configs',
    timestamps: false
})
export class VehicleRateConfig extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare id_vehicle_rate_configs: number;

    @Column({
        type: DataType.STRING(45),
        allowNull: false
    })
    declare name: string;

    @Column({
        type: DataType.STRING(60),
        allowNull: false
    })
    declare fields: string;

    @Column({
        type: DataType.TEXT('medium'),
        allowNull: true
    })
    declare description: string;
}
