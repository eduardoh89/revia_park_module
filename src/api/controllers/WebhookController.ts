import { Request, Response, NextFunction } from 'express';
import { Logger } from '../../shared/utils/logger';
import * as crypto from 'crypto';
import { AppDataSource } from '../../data-source';
import { Payment } from '../../entity/Payment';
import { ParkingSession } from '../../entity/ParkingSession';

const logger = new Logger('WebhookController');
const paymentRepository = AppDataSource.getRepository(Payment);
const sessionRepository = AppDataSource.getRepository(ParkingSession);

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

      // Podríamos verificar si existe la patente o si el monto coincide
      // Por ahora respondemos 200 OK para permitir la creación

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

      // Validar autenticación
      if (!validateApikey(headerApikey, order)) {
        logger.warn('Invalid Apikey in confirm webhook');
        // Aún así respondemos 200 pero no procesamos? O 403?
        // Klap reintentará si no es 200. Si la key es mala, quizás mejor 200 para que pare?
        // Vamos a lanzar error por seguridad.
        throw new Error('Error en autenticación');
      }

      // Procesar pago exitoso (TypeORM)
      const payment = await paymentRepository.findOne({
        where: { order_id: order.order_id },
        relations: ["parkingSession"]
      });

      if (payment) {
        // Actualizar Pago
        payment.status = 'COMPLETED';
        payment.mc_code = order.mc_code;
        payment.completed_at = new Date();
        await paymentRepository.save(payment);

        // Actualizar Sesión
        if (payment.parkingSession) {
          const session = payment.parkingSession;
          session.status = 'PAID';
          session.exit_time = new Date(); // Asumimos salida/pago
          await sessionRepository.save(session);
        }

        logger.info('Payment and Session updated to PAID', {
          orderId: order.order_id,
          sessionId: payment.parkingSession?.id_parking_sessions
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

      // Validar autenticación
      if (!validateApikey(headerApikey, order)) {
        logger.warn('Invalid Apikey in reject webhook');
        throw new Error('Error en autenticación');
      }

      // Actualizar pago a REJECTED
      const payment = await paymentRepository.findOneBy({ order_id: order.order_id });

      if (payment) {
        payment.status = 'REJECTED';
        await paymentRepository.save(payment);

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
