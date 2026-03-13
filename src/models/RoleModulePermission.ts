import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Role } from './Role';
import { ModuleItem } from './ModuleItem';

@Table({
    tableName: 'role_module_permissions',
    timestamps: false
})
export class RoleModulePermission extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare id_role_module_permissions: number;

    @Column({
        type: DataType.TINYINT,
        allowNull: false,
        defaultValue: 1
    })
    declare can_view: number;

    @Column({
        type: DataType.TINYINT,
        allowNull: false
    })
    declare can_create: number;

    @Column({
        type: DataType.TINYINT,
        allowNull: false
    })
    declare can_edit: number;

    @Column({
        type: DataType.TINYINT,
        allowNull: false
    })
    declare can_delete: number;

    @ForeignKey(() => Role)
    @Column({
        type: DataType.INTEGER.UNSIGNED,
        allowNull: false
    })
    declare id_roles: number;

    @ForeignKey(() => ModuleItem)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare id_module_items: number;

    @BelongsTo(() => Role)
    declare role: Role;

    @BelongsTo(() => ModuleItem)
    declare moduleItem: ModuleItem;
}
