import { Table, Column, Model, PrimaryKey, DataType, HasMany } from 'sequelize-typescript';
import { User } from './User';
import { RoleModulePermission } from './RoleModulePermission';

@Table({
    tableName: 'roles',
    timestamps: false
})
export class Role extends Model {
    @PrimaryKey
    @Column({
        type: DataType.INTEGER.UNSIGNED,
        allowNull: false
    })
    declare id_roles: number;

    @Column({
        type: DataType.STRING(50),
        allowNull: false
    })
    declare name: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true
    })
    declare description: string;

    @Column({
        type: DataType.TINYINT,
        allowNull: true,
        defaultValue: 1
    })
    declare is_active: number;

    @Column({
        type: DataType.TINYINT,
        allowNull: true
    })
    declare not_delete: number;

    @HasMany(() => User)
    declare users: User[];

    @HasMany(() => RoleModulePermission)
    declare roleModulePermissions: RoleModulePermission[];
}
