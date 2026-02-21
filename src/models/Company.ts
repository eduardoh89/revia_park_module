import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType } from 'sequelize-typescript';

@Table({
    tableName: 'companies',
    timestamps: false
})
export class Company extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare id_companies: number;

    @Column({
        type: DataType.STRING(12),
        allowNull: false
    })
    declare rut: string;

    @Column({
        type: DataType.STRING(45),
        allowNull: true,
        unique: true
    })
    declare name: string;

    @Column({
        type: DataType.STRING(45),
        allowNull: false
    })
    declare business_name: string;

    @Column({
        type: DataType.STRING(45),
        allowNull: true
    })
    declare phone: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true
    })
    declare email: string;
}
