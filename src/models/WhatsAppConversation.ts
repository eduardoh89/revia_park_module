import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType, ForeignKey, BelongsTo, CreatedAt } from 'sequelize-typescript';
import { WhatsAppContact } from './WhatsAppContact';
import { ParkingSession } from './ParkingSession';

export type MessageType = 'incoming' | 'outgoing';

@Table({
    tableName: 'whatsapp_conversations',
    timestamps: false
})
export class WhatsAppConversation extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare id_whatsapp_conversations: number;

    @ForeignKey(() => WhatsAppContact)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare id_whatsapp_contacts: number;

    @BelongsTo(() => WhatsAppContact)
    declare whatsappContact: WhatsAppContact;

    @ForeignKey(() => ParkingSession)
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        comment: 'Sesión de parqueo relacionada (contiene vehículo, estacionamiento, etc.)'
    })
    declare id_parking_sessions?: number;

    @BelongsTo(() => ParkingSession)
    declare parkingSession?: ParkingSession;

    @Column({
        type: DataType.ENUM('incoming', 'outgoing'),
        allowNull: false,
        comment: 'Tipo de mensaje: incoming (recibido) o outgoing (enviado)'
    })
    declare message_type: MessageType;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
        comment: 'Contenido del mensaje'
    })
    declare message_content: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
        comment: 'Paso del flujo: welcome, license_search, payment_info, etc.'
    })
    declare flow_step?: string;

    @Column({
        type: DataType.JSON,
        allowNull: true,
        comment: 'Metadatos adicionales (patente buscada, monto, etc.)'
    })
    declare metadata?: object;

    @CreatedAt
    @Column({
        type: DataType.DATE,
        field: 'created_at'
    })
    declare created_at: Date;
}
