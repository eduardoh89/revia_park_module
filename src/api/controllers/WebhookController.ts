import { Request, Response } from 'express';
import { Logger } from '../../shared/utils/logger';
import * as crypto from 'crypto';
import { Payment } from '../../models/Payment';
import { ParkingSession } from '../../models/ParkingSession';
import { Vehicle } from '../../models/Vehicle';
import { ParkingLot } from '../../models/ParkingLot';
import { WhatsAppConversation } from '../../models/WhatsAppConversation';
import { WhatsAppContact } from '../../models/WhatsAppContact';
import { sendWhatsAppMessage } from '../../whatsapp/services/WhatsAppService';

const logger = new Logger('WebhookController');

/**
 * Valida el apikey del header usando SHA256
 * hash = sha256(reference_id + order_id + apikey)
 */
function validateApikey(headerApikey: string, order: any): boolean {
  const referenceId = order.reference_id;
  const orderId = order.order_id;
  const apikey = process.env.KLAP_API_KEY || '';

  const key = referenceId + orderId + apikey;
  const hashApiKey = crypto.createHash('sha256').update(key).digest('hex');

  logger.info('Validating webhook apikey', {
    referenceId,
    orderId,
    headerMatch: hashApiKey === headerApikey,
  });

  return hashApiKey === headerApikey;
}

export class WebhookController {
  /**
   * POST /api/v1/webhooks/klap/validation
   * Se activa cuando se crea una orden
   */
  static async webhookValidation(req: Request, res: Response) {
    try {
      const order = req.body;

      logger.info('=== WEBHOOK VALIDATION ===', {
        referenceId: order.reference_id,
        orderId: order.order_id,
      });

      res.status(200).json(order);
    } catch (error) {
      logger.error('Webhook validation error:', error);
      res.status(500).end('error');
    }
  }

  /**
   * POST /api/v1/webhooks/klap/confirm
   * Se activa cuando el pago es exitoso
   */
  static async webhookConfirm(req: Request, res: Response) {
    try {
      const order = req.body;
      const headerApikey = req.header('Apikey') || '';

      logger.info('=== WEBHOOK CONFIRM ===', {
        referenceId: order.reference_id,
        orderId: order.order_id,
        status: order.status,
      });

      if (!validateApikey(headerApikey, order)) {
        logger.warn('Invalid Apikey in confirm webhook');
        throw new Error('Error en autenticación');
      }

      const payment = await Payment.findOne({
        where: { order_id: order.order_id },
        include: [{ model: ParkingSession }]
      });

      if (payment) {
        await payment.update({
          status: 'COMPLETED',
          mc_code: order.mc_code,
          completed_at: new Date()
        });

        const session = await ParkingSession.findByPk(payment.id_parking_sessions, {
          include: [
            { model: Vehicle, as: 'vehicle' },
            { model: ParkingLot }
          ]
        });

        if (session) {
          await session.update({
            status: 'EXITED_PAID',
            //exit_time: new Date(),
            pay_time: new Date()
          });

          // Buscar el contacto de WhatsApp asociado a esta sesión
          const conversation = await WhatsAppConversation.findOne({
            where: { id_parking_sessions: session.id_parking_sessions },
            include: [{ model: WhatsAppContact }],
            order: [['created_at', 'DESC']]
          });

          if (conversation && conversation.whatsappContact) {
            const phoneNumber = conversation.whatsappContact.phone_number;
            const vehicle = session.vehicle;
            const licensePlate = vehicle?.license_plate || 'N/A';
            const parkingLot = session.parkingLot;

            const confirmationMessage =
              `✅ *Pago Confirmado*\n\n` +
              `Tu pago de *$${payment.amount.toLocaleString('es-CL')}* para el vehículo *${licensePlate}* ` +
              `ha sido procesado exitosamente.\n\n` +
              `Código de transacción: ${order.mc_code}\n\n` +
              `¡Gracias por usar REVIA! 🚗`;

            // Enviar mensaje de confirmación por WhatsApp
            const messageSent = await sendWhatsAppMessage(phoneNumber, confirmationMessage);

            if (messageSent) {
              // Guardar el mensaje enviado en la base de datos
              await WhatsAppConversation.create({
                id_whatsapp_contacts: conversation.id_whatsapp_contacts,
                id_parking_sessions: session.id_parking_sessions,
                message_type: 'outgoing',
                message_content: confirmationMessage,
                flow_step: 'payment_confirmed',
                metadata: {
                  orderId: order.order_id,
                  mcCode: order.mc_code,
                  amount: payment.amount,
                  licensePlate: licensePlate
                }
              });

              logger.info('Payment confirmation sent via WhatsApp', {
                phoneNumber,
                licensePlate,
                orderId: order.order_id
              });

            }
          } else {
            logger.warn('No WhatsApp contact found for session', {
              sessionId: session.id_parking_sessions
            });
          }
        }

        logger.info('Payment and Session updated to PAID', {
          orderId: order.order_id,
          sessionId: payment.id_parking_sessions
        });
      } else {
        logger.warn('Payment record not found for webhook', { orderId: order.order_id });
      }

      res.status(200).json(order);
    } catch (error) {
      logger.error('Webhook confirm error:', error);
      res.status(500).end('error');
    }
  }

  /**
   * POST /api/v1/webhooks/klap/reject
   * Se activa cuando el pago falla
   */
  static async webhookReject(req: Request, res: Response) {
    try {
      const order = req.body;
      const headerApikey = req.header('Apikey') || '';

      logger.info('=== WEBHOOK REJECT ===', {
        referenceId: order.reference_id,
        orderId: order.order_id,
        status: order.status,
      });

      if (!validateApikey(headerApikey, order)) {
        logger.warn('Invalid Apikey in reject webhook');
        throw new Error('Error en autenticación');
      }

      const payment = await Payment.findOne({ where: { order_id: order.order_id } });

      if (payment) {
        await payment.update({ status: 'REJECTED' });
        logger.info('Payment status updated to REJECTED', { orderId: order.order_id });
      }

      res.status(200).json(order);
    } catch (error) {
      logger.error('Webhook reject error:', error);
      res.status(500).end('error');
    }
  }

  /**
   * GET /api/v1/webhooks/health
   */
  static async healthCheck(req: Request, res: Response) {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  }
}
