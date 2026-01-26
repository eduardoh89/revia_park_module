import { addKeyword, EVENTS } from '@builderbot/bot';
import { WhatsAppContact } from '../../models/WhatsAppContact';
import { WhatsAppConversation } from '../../models/WhatsAppConversation';
import { Vehicle } from '../../models/Vehicle';
import { ParkingSession } from '../../models/ParkingSession';
import { PaymentLinkService } from '../services/PaymentLinkService';

const delay = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

const welcomeFlow = addKeyword(EVENTS.WELCOME).addAnswer(
    '¡Bienvenido al sistema de pago de REVIA! 👋\n\n' +
    'Soy tu asistente virtual para gestionar el pago de tu estadía.\n\n' +
    'Por favor, ingresa la *patente de tu vehículo* para continuar.\n\n' +
    '_Ejemplo: ABC123 o abc123_',
    { capture: true },
    async (ctx, ctxFn) => {
        const patente = ctx.body.trim().toUpperCase();
        const phoneNumber = ctx.from; // Ej: "56912345678"
        const userName = ctx.pushName || ctx.name || 'Usuario';

        try {
            // 1. Guardar o actualizar contacto de WhatsApp
            let contact = await WhatsAppContact.findOne({
                where: { phone_number: phoneNumber }
            });

            if (!contact) {
                contact = await WhatsAppContact.create({
                    phone_number: phoneNumber,
                    name: userName,
                    is_active: true
                });

                // Recargar para obtener el ID generado
                await contact.reload();
            } else {
                // Actualizar nombre si cambió
                if (contact.name !== userName) {
                    await contact.update({ name: userName });
                }
            }

            // Verificar que tenemos el ID del contacto
            if (!contact.id_whatsapp_contacts) {
                throw new Error('Contact ID not available after creation');
            }

            // 2. Guardar mensaje entrante (patente del usuario)
            await WhatsAppConversation.create({
                id_whatsapp_contacts: contact.id_whatsapp_contacts,
                message_type: 'incoming',
                message_content: patente,
                flow_step: 'license_search',
                metadata: {
                    userName: userName,
                    timestamp: new Date()
                }
            });

            // 3. Enviar mensaje de búsqueda
            const searchMessage = `🔍 Buscando información de la patente *${patente}*...\n\n⏳ Un momento por favor...`;
            await ctxFn.flowDynamic(searchMessage);

            // Guardar mensaje saliente
            await WhatsAppConversation.create({
                id_whatsapp_contacts: contact.id_whatsapp_contacts,
                message_type: 'outgoing',
                message_content: searchMessage,
                flow_step: 'license_search'
            });

        

            // 4. Buscar vehículo y sesión activa en la base de datos
            const vehicle = await Vehicle.findOne({
                where: { license_plate: patente },
                   raw: true,
                nest: true,
            });
            

            if (!vehicle) {
                const errorMessage =
                    '❌ No encontramos tu vehículo en el sistema.\n\n' +
                    'Por favor verifica que:\n' +
                    '• La patente esté escrita correctamente\n' +
                    '• Tu vehículo haya ingresado al recinto';

                // Enviar mensaje con botones usando el método correcto
                try {
                    await ctxFn.provider.sendButtons(
                        ctx.from,
                        [
                            { body: '🔄 Reintentar' },
                            { body: '❌ Salir' }
                        ],
                        errorMessage
                    );
                } catch (error) {
                    // Fallback: enviar mensaje simple si los botones no funcionan
                    await ctxFn.flowDynamic(errorMessage + '\n\nEscribe *hola* para reintentar.');
                }

                await WhatsAppConversation.create({
                    id_whatsapp_contacts: contact.id_whatsapp_contacts,
                    message_type: 'outgoing',
                    message_content: errorMessage,
                    flow_step: 'vehicle_not_found',
                    metadata: {
                        licensePlate: patente,
                        reason: 'Vehicle not found in database'
                    }
                });

                return ctxFn.endFlow();
            }

            // 5. Buscar sesión activa
            const session = await ParkingSession.findOne({
                where: {
                    id_vehicles: vehicle.id_vehicles,
                    status: 'PARKED'
                }
            });

            if (!session) {
                const noSessionMessage =
                    '❌ No encontramos una sesión de estacionamiento activa para este vehículo.\n\n' +
                    'El vehículo puede que ya haya salido o el pago ya fue realizado.\n\n' +
                    '¿Qué deseas hacer?';

                // Enviar mensaje con botones usando el método correcto
                try {
                    await ctxFn.provider.sendButtons(
                        ctx.from,
                        [
                            { body: '🔄 Otra patente' },
                            { body: '❌ Salir' }
                        ],
                        noSessionMessage
                    );
                } catch (error) {
                    // Fallback: enviar mensaje simple si los botones no funcionan
                    await ctxFn.flowDynamic(noSessionMessage + '\n\nEscribe *hola* para buscar otra patente.');
                }

                await WhatsAppConversation.create({
                    id_whatsapp_contacts: contact.id_whatsapp_contacts,
                    message_type: 'outgoing',
                    message_content: noSessionMessage,
                    flow_step: 'session_not_found',
                    metadata: {
                        licensePlate: patente,
                        reason: 'No active parking session'
                    }
                });

                return ctxFn.endFlow();
            }

            // 6. Calcular tiempo transcurrido
            const arrivalTime = new Date(session.arrival_time);
            const now = new Date();
            const diffMs = now.getTime() - arrivalTime.getTime();
            const diffMinutes = Math.floor(diffMs / 60000);
            const hours = Math.floor(diffMinutes / 60);
            const minutes = diffMinutes % 60;
            const tiempoTranscurrido = hours > 0
                ? `${hours} hora${hours > 1 ? 's' : ''} ${minutes} minuto${minutes !== 1 ? 's' : ''}`
                : `${minutes} minuto${minutes !== 1 ? 's' : ''}`;

            // 7. Generar link de pago directamente con el servicio
            let paymentUrl = '';
            let amount = 0;

            try {
                const paymentLinkService = new PaymentLinkService();
                const paymentResult = await paymentLinkService.createPaymentLink(
                    patente, 
                    session.id_parking_sessions
                );

                paymentUrl = paymentResult.paymentUrl;
                amount = paymentResult.amount;
            } catch (error) {
                console.error('Error creating payment link:', error);

                const errorPaymentMessage = '❌ Error al generar el link de pago. Por favor intenta nuevamente más tarde.';
                await ctxFn.flowDynamic(errorPaymentMessage);

                await WhatsAppConversation.create({
                    id_whatsapp_contacts: contact.id_whatsapp_contacts,
                    id_parking_sessions: session.id_parking_sessions,
                    message_type: 'outgoing',
                    message_content: errorPaymentMessage,
                    flow_step: 'payment_error'
                });

                return ctxFn.endFlow();
            }

            // 8. Enviar información del vehículo
            const horaIngreso = arrivalTime.toLocaleTimeString('es-CL', {
                hour: '2-digit',
                minute: '2-digit'
            });

            const vehicleInfoMessage =
                '✅ *Vehículo encontrado*\n\n' +
                `📋 *Patente:* ${patente}\n` +
                `🕐 *Hora de ingreso:* ${horaIngreso}\n` +
                `⏱️ *Tiempo transcurrido:* ${tiempoTranscurrido}\n` +
                `💰 *Monto a pagar:* $${amount.toLocaleString('es-CL')}\n\n` +
                'Para finalizar, realiza tu pago en el siguiente enlace:';

            await ctxFn.flowDynamic(vehicleInfoMessage);

            await WhatsAppConversation.create({
                id_whatsapp_contacts: contact.id_whatsapp_contacts,
                id_parking_sessions: session.id_parking_sessions,
                message_type: 'outgoing',
                message_content: vehicleInfoMessage,
                flow_step: 'payment_info',
                metadata: {
                    licensePlate: patente,
                    amount: amount,
                    arrivalTime: arrivalTime,
                    timeElapsed: tiempoTranscurrido
                }
            });

            await delay(1000);

            // 9. Enviar link de pago con botones
            const paymentLinkMessage =
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
                    paymentLinkMessage
                );
            } catch (error) {
                // Fallback: enviar mensaje simple si los botones no funcionan
                await ctxFn.flowDynamic(paymentLinkMessage);
            }

            /* CÓDIGO COMENTADO: Botón URL (para uso futuro)
             * Este código envía un botón verde con URL que abre el link directamente
             * Desventaja: No permite agregar botones adicionales como "Nuevo link" o "Salir"
             *
             * const paymentLinkMessage =
             *     '💳 *Link de pago generado*\n\n' +
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
             *     await ctxFn.provider.sendButtonUrl(ctx.from, button, paymentLinkMessage);
             * } catch (error) {
             *     console.error('Error sending URL button:', error);
             *     await ctxFn.flowDynamic(`🔗 *Pagar ahora:*\n${paymentUrl}\n\n⏰ _Este link expira en 5 minutos_`);
             * }
             */

            await WhatsAppConversation.create({
                id_whatsapp_contacts: contact.id_whatsapp_contacts,
                id_parking_sessions: session.id_parking_sessions,
                message_type: 'outgoing',
                message_content: paymentLinkMessage,
                flow_step: 'payment_link_sent',
                metadata: {
                    paymentUrl: paymentUrl,
                    amount: amount
                }
            });

        } catch (error) {
            console.error('Error in WhatsApp flow:', error);

            const genericErrorMessage = '❌ Ocurrió un error. Por favor intenta nuevamente o contacta con soporte.';
            await ctxFn.flowDynamic(genericErrorMessage);

            // Intentar guardar el error
            try {
                const contact = await WhatsAppContact.findOne({
                    where: { phone_number: phoneNumber }
                });

                if (contact) {
                    await WhatsAppConversation.create({
                        id_whatsapp_contacts: contact.id_whatsapp_contacts,
                        message_type: 'outgoing',
                        message_content: genericErrorMessage,
                        flow_step: 'error',
                        metadata: {
                            error: error instanceof Error ? error.message : 'Unknown error'
                        }
                    });
                }
            } catch (saveError) {
                console.error('Error saving error message:', saveError);
            }
        }

        return ctxFn.endFlow();
    }
);

export { welcomeFlow };
