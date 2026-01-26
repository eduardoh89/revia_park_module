import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
    tableName: 'whatsapp_contacts',
    timestamps: true,
    underscored: true
})
export class WhatsAppContact extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare id_whatsapp_contacts: number;

    @Column({
        type: DataType.STRING(20),
        allowNull: false,
        unique: true,
        comment: 'Número de teléfono con código de país, ej: 56912345678'
    })
    declare phone_number: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
        comment: 'Nombre del contacto (pushName de WhatsApp)'
    })
    declare name?: string;

    @Column({
        type: DataType.BOOLEAN,
        defaultValue: true,
        allowNull: false
    })
    declare is_active: boolean;

    @CreatedAt
    @Column({
        type: DataType.DATE,
        field: 'created_at'
    })
    declare created_at: Date;

    @UpdatedAt
    @Column({
        type: DataType.DATE,
        field: 'updated_at'
    })
    declare updated_at: Date;
}
