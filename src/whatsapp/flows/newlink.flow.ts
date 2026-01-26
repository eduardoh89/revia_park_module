import { addKeyword } from '@builderbot/bot';
import { WhatsAppContact } from '../../models/WhatsAppContact';
import { WhatsAppConversation } from '../../models/WhatsAppConversation';
import { ParkingSession } from '../../models/ParkingSession';
import { Vehicle } from '../../models/Vehicle';
import { PaymentLinkService } from '../services/PaymentLinkService';

const delay = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Flujo para generar un nuevo link de pago
 * Se activa cuando el usuario presiona el botón "🔄 Nuevo link"
 */
const newLinkFlow = addKeyword(['🔄 Nuevo link', 'nuevo link', 'generar link']).addAnswer(
    '🔄 Generando nuevo link de pago...',
    { capture: false },
    async (ctx, ctxFn) => {
        const phoneNumber = ctx.from;

        try {
            // Buscar el contacto
            const contact = await WhatsAppContact.findOne({
                where: { phone_number: phoneNumber }
            });

            if (!contact) {
                await ctxFn.flowDynamic('❌ No se encontró tu información. Por favor escribe *hola* para comenzar nuevamente.');
                return ctxFn.endFlow();
            }

            // Buscar la última conversación para obtener la sesión
            const lastConversation = await WhatsAppConversation.findOne({
                where: {
                    id_whatsapp_contacts: contact.id_whatsapp_contacts,
                    flow_step: 'payment_link_sent'
                },
                order: [['created_at', 'DESC']],
                include: [{
                    model: ParkingSession,
                    include: [Vehicle]
                }]
            });

            if (!lastConversation || !lastConversation.parkingSession) {
                await ctxFn.flowDynamic('❌ No se encontró información de tu sesión. Por favor escribe *hola* para comenzar nuevamente.');
                return ctxFn.endFlow();
            }

            const session = lastConversation.parkingSession;

            // Verificar que la sesión siga en estado PARKED
            if (session.status !== 'PARKED') {
                const message = session.status === 'PAID'
                    ? '✅ Tu sesión ya fue pagada. No es necesario generar un nuevo link.'
                    : '❌ No se puede generar un nuevo link. La sesión no está activa.';

                await ctxFn.flowDynamic(message);
                return ctxFn.endFlow();
            }

            // Obtener la patente del vehículo desde la sesión
            const vehicle = (session as any).vehicle;
            const patente = vehicle?.license_plate;

            if (!patente) {
                await ctxFn.flowDynamic('❌ No se pudo obtener la información del vehículo. Por favor escribe *hola* para comenzar nuevamente.');
                return ctxFn.endFlow();
            }

            // Generar nuevo link de pago
            try {
                const paymentLinkService = new PaymentLinkService();
                const paymentResult = await paymentLinkService.createPaymentLink(
                    patente,
                    session.id_parking_sessions
                );

                const paymentUrl = paymentResult.paymentUrl;
                const amount = paymentResult.amount;

                await delay(1000);

                const newLinkMessage =
                    `✅ *Nuevo link generado*\n\n` +
                    `🔗 *Pagar ahora:*\n${paymentUrl}\n\n` +
                    '⏰ _Este link expira en 5 minutos_\n\n' +
                    '💡 _Tip: Haz clic en el link para realizar el pago de forma segura._';

                // Enviar mensaje con botones de acción
                try {
                    await ctxFn.provider.sendButtons(
                        ctx.from,
                        [
                            { body: '🔄 Nuevo link' },
                            { body: '❌ Salir' }
                        ],
                        newLinkMessage
                    );
                } catch (error) {
                    await ctxFn.flowDynamic(newLinkMessage);
                }

                /* CÓDIGO COMENTADO: Botón URL (para uso futuro)
                 * Este código envía un botón verde con URL que abre el link directamente
                 * Desventaja: No permite agregar botones adicionales como "Nuevo link" o "Salir"
                 *
                 * const newLinkMessage =
                 *     '✅ *Nuevo link generado*\n\n' +
                 *     '💳 *Link de pago actualizado*\n\n' +
                 *     '⏰ _Este link expira en 5 minutos_\n\n' +
                 *     `💰 *Monto a pagar:* $${amount.toLocaleString('es-CL')}\n\n` +
                 *     '👇 Haz clic en el botón de abajo para realizar el pago de forma segura.';
                 *
                 * try {
                 *     const button = {
                 *         body: 'Pagar Estacionamiento',
                 *         url: paymentUrl,
                 *         text: '💳 Pagar ahora'
                 *     };
                 *     await ctxFn.provider.sendButtonUrl(ctx.from, button, newLinkMessage);
                 * } catch (error) {
                 *     console.error('Error sending URL button:', error);
                 *     await ctxFn.flowDynamic(`✅ *Nuevo link generado*\n\n🔗 *Pagar ahora:*\n${paymentUrl}\n\n⏰ _Este link expira en 5 minutos_`);
                 * }
                 */

                await WhatsAppConversation.create({
                    id_whatsapp_contacts: contact.id_whatsapp_contacts,
                    id_parking_sessions: session.id_parking_sessions,
                    message_type: 'outgoing',
                    message_content: newLinkMessage,
                    flow_step: 'payment_link_sent',
                    metadata: {
                        paymentUrl: paymentUrl,
                        amount: amount,
                        licensePlate: patente,
                        isNewLink: true
                    }
                });

            } catch (error) {
                console.error('Error creating new payment link:', error);
                await ctxFn.flowDynamic('❌ Error al generar el nuevo link. Por favor intenta nuevamente más tarde.');
            }

        } catch (error) {
            console.error('Error in new link flow:', error);
            await ctxFn.flowDynamic('❌ Ocurrió un error. Por favor intenta nuevamente o contacta con soporte.');
        }

        return ctxFn.endFlow();
    }
);

export { newLinkFlow };
