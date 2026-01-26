import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType } from 'sequelize-typescript';

@Table({
    tableName: 'parking_lots',
    timestamps: false
})
export class ParkingLot extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id_parking_lots!: number;

    @Column({
        type: DataType.STRING(100),
        allowNull: false
    })
    name!: string;

    @Column({
        type: DataType.STRING(200),
        allowNull: true
    })
    address?: string;

    @Column({
        type: DataType.STRING(15),
        allowNull: true
    })
    phone?: string;

    @Column({
        type: DataType.STRING(200),
        allowNull: true
    })
    email?: string;
}
