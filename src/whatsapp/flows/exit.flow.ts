import { addKeyword } from '@builderbot/bot';
import { WhatsAppContact } from '../../models/WhatsAppContact';
import { WhatsAppConversation } from '../../models/WhatsAppConversation';

/**
 * Flujo para manejar cuando el usuario presiona "Salir"
 */
const exitFlow = addKeyword(['❌ Salir', 'salir', 'cancelar', 'exit']).addAnswer(
    '👋 Entendido.\n\n' +
    'Si necesitas realizar un pago más tarde, escribe *hola* para comenzar nuevamente.\n\n' +
    '¡Hasta pronto! 😊',
    { capture: false },
    async (ctx, ctxFn) => {
        const phoneNumber = ctx.from;

        try {
            // Guardar el mensaje de salida en la base de datos
            const contact = await WhatsAppContact.findOne({
                where: { phone_number: phoneNumber }
            });

            if (contact && contact.id_whatsapp_contacts) {
                await WhatsAppConversation.create({
                    id_whatsapp_contacts: contact.id_whatsapp_contacts,
                    message_type: 'outgoing',
                    message_content: 'Usuario salió de la conversación',
                    flow_step: 'exit',
                    metadata: {
                        timestamp: new Date()
                    }
                });
            }
        } catch (error) {
            console.error('Error saving exit flow:', error);
        }

        return ctxFn.endFlow();
    }
);

export { exitFlow };
