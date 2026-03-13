import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { ParkingLot } from './ParkingLot';

@Table({
    tableName: 'qr_configs',
    timestamps: false
})
export class QRConfig extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare id_qr_configs: number;

    @Column({
        type: DataType.STRING(50),
        allowNull: false
    })
    declare slug: string;

    @Column({
        type: DataType.STRING(20),
        allowNull: true
    })
    declare phone: string;

    @Column({
        type: DataType.TEXT,
        allowNull: false
    })
    declare message: string;

    @Column({
        type: DataType.TINYINT,
        allowNull: false
    })
    declare active: number;

    @Column({
        type: DataType.DATE,
        allowNull: true
    })
    declare updated_at: Date;

    @ForeignKey(() => ParkingLot)
    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare id_parking_lots?: number;

    @BelongsTo(() => ParkingLot)
    declare parkingLot: ParkingLot;
}
