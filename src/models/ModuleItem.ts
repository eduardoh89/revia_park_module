import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Module } from './Module';

@Table({
    tableName: 'module_items',
    timestamps: false
})
export class ModuleItem extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare id_module_items: number;

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
        type: DataType.STRING(50),
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

    @ForeignKey(() => Module)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare id_modules: number;

    @BelongsTo(() => Module)
    declare module: Module;
}
