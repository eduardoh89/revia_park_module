import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { KlapService } from '../../infrastructure/payment/KlapService';
import { Payment } from '../../models/Payment';
import { ParkingSession } from '../../models/ParkingSession';
import { Vehicle } from '../../models/Vehicle';
import { Logger } from '../../shared/utils/logger';

const logger = new Logger('PaymentController');
const klapService = new KlapService();

export class PaymentController {
  /**
   * POST /api/v1/payments/create
   * Crear pago y generar link temporal (usado por WhatsApp Bot)
   * Retorna un link que expira en 5 minutos
   */
  static async createPaymentLink(req: Request, res: Response, next: NextFunction) {
    try {
      const { licensePlate } = req.body;

      if (!licensePlate) {
        return res.status(400).json({
          success: false,
          error: 'La patente es requerida',
        });
      }

      // Buscar vehículo por patente
      const vehicle = await Vehicle.findOne({
        where: { license_plate: licensePlate }
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: 'Vehículo no encontrado',
        });
      }

      // Buscar sesión activa del vehículo
      const session = await ParkingSession.findOne({
        where: {
          id_vehicles: vehicle.id_vehicles,
          status: 'PARKED'
        }
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'No se encontró una sesión de estacionamiento activa para esta patente.',
        });
      }

      // Calcular monto a pagar (puedes importar el método de VehicleController)
      const amount = 30000; // Por ahora hardcodeado, después lo calculas dinámicamente

      const klapPayment = await klapService.createPayment({
        amount: amount,
        description: `Pago estacionamiento - ${licensePlate}`,
        licensePlate: licensePlate,
        userEmail: '',
      });

      // Crear link temporal (expira en 5 minutos)
      const linkCode = uuidv4();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

      const payment = await Payment.create({
        order_id: klapPayment.orderId,
        reference_id: klapPayment.referenceId,
        amount: amount,
        status: 'PENDING',
        id_parking_sessions: session.id_parking_sessions,
        link_code: linkCode,
        link_is_used: false,
        link_expires_at: expiresAt,
      });

      const paymentUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/v1/payments/checkout?code=${linkCode}`;

      logger.info('Payment link created', {
        licensePlate,
        linkCode,
        expiresAt,
        paymentUrl
      });

      res.json({
        success: true,
        data: {
          paymentUrl,
          expiresAt,
          amount,
          licensePlate
        }
      });
    } catch (error) {
      logger.error('Error creating payment link', { error });
      next(error);
    }
  }

  /**
   * GET /api/v1/payments/checkout?code=xxx
   * Mostrar formulario de pago usando el código del link
   */
  static async checkout(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.query;

      if (!code || typeof code !== 'string') {
        return res.status(400).render('result', {
          title: 'Error',
          type: 'error',
          message: 'Código de pago inválido',
        });
      }

      const payment = await Payment.findOne({
        where: { link_code: code },
        include: [{
          model: ParkingSession,
          include: [Vehicle]
        }]
      });

      if (!payment) {
        return res.status(404).render('result', {
          title: 'Error',
          type: 'error',
          message: 'Link de pago no encontrado',
        });
      }

      // Verificar si el link ya fue usado
      if (payment.link_is_used) {
        return res.status(410).render('result', {
          title: 'Link Usado',
          type: 'error',
          message: 'Este link de pago ya fue utilizado',
        });
      }

      // Verificar si el link expiró
      if (payment.isLinkExpired()) {
        return res.status(410).render('result', {
          title: 'Link Expirado',
          type: 'error',
          message: 'Este link de pago ha expirado. Por favor solicita uno nuevo.',
        });
      }

      // Marcar el link como usado
      await payment.update({ link_is_used: true });

      const session = payment.parkingSession;
      const vehicle = await Vehicle.findByPk(session.id_vehicles);

      logger.info('Payment checkout accessed', {
        linkCode: code,
        orderId: payment.order_id,
        licensePlate: vehicle?.license_plate
      });

      // Renderizar formulario de pago
      res.render('checkout', {
        title: 'Realizar Pago',
        orderId: payment.order_id,
        amount: payment.amount,
        description: `Pago estacionamiento - ${vehicle?.license_plate}`,
        licensePlate: vehicle?.license_plate,
      });
    } catch (error) {
      logger.error('Error in checkout', { error });
      next(error);
    }
  }

  /**
   * GET /success
   * Página de pago exitoso
   */
  static async success(req: Request, res: Response) {
    res.render('result', {
      title: 'Pago Exitoso',
      type: 'success',
      message: '¡Tu pago se ha procesado correctamente!',
    });
  }

  /**
   * GET /cancel
   * Página de pago cancelado
   */
  static async cancel(req: Request, res: Response) {
    res.render('result', {
      title: 'Pago Cancelado',
      type: 'cancel',
      message: 'Has cancelado el pago',
    });
  }

  /**
   * GET /error
   * Página de error
   */
  static async error(req: Request, res: Response) {
    res.render('result', {
      title: 'Error en el Pago',
      type: 'error',
      message: req.query.message as string || 'Ocurrió un error al procesar el pago',
    });
  }
}
