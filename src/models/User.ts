import { Table, Column, Model, PrimaryKey, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Role } from './Role';

@Table({
    tableName: 'users',
    timestamps: false
})
export class User extends Model {
    @PrimaryKey
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare id_users: number;

    @Column({
        type: DataType.STRING(100),
        allowNull: true
    })
    declare name: string;

    @ForeignKey(() => Role)
    @Column({
        type: DataType.INTEGER.UNSIGNED,
        allowNull: false
    })
    declare id_roles: number;

    @BelongsTo(() => Role)
    declare role: Role;
}
