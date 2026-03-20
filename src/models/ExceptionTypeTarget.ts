import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType, HasMany } from 'sequelize-typescript';

@Table({
    tableName: 'exception_type_targets',
    timestamps: false
})
export class ExceptionTypeTarget extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare id_exception_type_targets: number;

    @Column({
        type: DataType.STRING(45),
        allowNull: false
    })
    declare name: string;

    @Column({
        type: DataType.TEXT('medium'),
        allowNull: true
    })
    declare description?: string;

    @Column({
        type: DataType.STRING(45),
        allowNull: true
    })
    declare entity_type?: string;

    @Column({
        type: DataType.STRING(60),
        allowNull: true
    })
    declare entity_id?: string;
}
