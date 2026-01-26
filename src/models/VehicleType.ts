import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType } from 'sequelize-typescript';

@Table({
    tableName: 'vehicle_types',
    timestamps: false
})
export class VehicleType extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id_vehicle_types!: number;

    @Column({
        type: DataType.STRING(45),
        allowNull: false
    })
    name!: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true
    })
    description?: string;
}
