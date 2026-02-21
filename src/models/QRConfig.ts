import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType } from 'sequelize-typescript';

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
}
