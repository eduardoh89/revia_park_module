import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Vehicle } from './Vehicle';

@Table({
    tableName: 'unidentified_vehicles',
    timestamps: false
})
export class UnidentifiedVehicle extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare id_unidentified_vehicles: number;

    @Column({
        type: DataType.STRING(30),
        allowNull: true
    })
    declare temp_reference?: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true
    })
    declare capture_image_url?: string;

    @Column({
        type: DataType.TEXT('medium'),
        allowNull: true
    })
    declare notes?: string;

    @Column({
        type: DataType.DATE,
        allowNull: true
    })
    declare created_at?: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true
    })
    declare resolved_at?: Date;

    @Column({
        type: DataType.ENUM('ENTRY', 'EXIT'),
        allowNull: true
    })
    declare movement_type?: 'ENTRY' | 'EXIT';

    @ForeignKey(() => Vehicle)
    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare id_vehicles?: number;

    @BelongsTo(() => Vehicle)
    declare vehicle?: Vehicle;
}
