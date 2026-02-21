import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType, HasMany } from 'sequelize-typescript';
import { ModuleItem } from './ModuleItem';

@Table({
    tableName: 'modules',
    timestamps: false
})
export class Module extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare id_modules: number;

    @Column({
        type: DataType.STRING(10),
        allowNull: true
    })
    declare code: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: false
    })
    declare name: string;

    @Column({
        type: DataType.STRING(45),
        allowNull: true
    })
    declare icon: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: false
    })
    declare route: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare sort_order: number;

    @Column({
        type: DataType.TINYINT,
        allowNull: false,
        defaultValue: 1
    })
    declare is_active: number;

    @HasMany(() => ModuleItem)
    declare moduleItems: ModuleItem[];
}
