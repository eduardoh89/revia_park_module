import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType, HasMany, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { ExceptionTypeTarget } from './ExceptionTypeTarget';

@Table({
    tableName: 'exception_types',
    timestamps: false
})
export class ExceptionType extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare id_exception_types: number;

    @Column({
        type: DataType.STRING(30),
        allowNull: false
    })
    declare code: string;

    @Column({
        type: DataType.STRING(60),
        allowNull: false
    })
    declare name: string;

    @Column({
        type: DataType.TINYINT,
        allowNull: false,
        defaultValue: 0
    })
    declare requires_supervisor: number;

    @Column({
        type: DataType.TINYINT,
        allowNull: false,
        defaultValue: 0
    })
    declare requires_evidence: number;

    @Column({
        type: DataType.TINYINT,
        allowNull: false,
        defaultValue: 1
    })
    declare is_active: number;

    @Column({
        type: DataType.TINYINT,
        allowNull: false,
        defaultValue: 0
    })
    declare not_delete: number;

    @ForeignKey(() => ExceptionTypeTarget)
    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare id_exception_type_targets?: number;

    @BelongsTo(() => ExceptionTypeTarget)
    declare exceptionTypeTarget?: ExceptionTypeTarget;
}
