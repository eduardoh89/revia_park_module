import { Request, Response, NextFunction } from 'express';
import { KlapService } from '../../infrastructure/payment/KlapService';
import { AppDataSource } from '../../data-source';
import { Payment } from '../../entity/Payment';
import { ParkingSession } from '../../entity/ParkingSession';
import { Vehicle } from '../../entity/Vehicle';
import { Logger } from '../../shared/utils/logger';

const logger = new Logger('PaymentController');
const klapService = new KlapService();
const paymentRepository = AppDataSource.getRepository(Payment);
const sessionRepository = AppDataSource.getRepository(ParkingSession);

export class PaymentController {
  /**
   * POST /create
   * Crear orden de pago y devolver datos para el checkout
   */
  static async checkout(req: Request, res: Response, next: NextFunction) {

    console.log(req.body);

    try {
      const { amount, description, email, licensePlate = 'PTCL23' } = req.body;

      // Validar campos requeridos
      if (!amount) {
        return res.status(400).json({
          success: false,
          error: 'El monto es requerido',
        });
      }

      if (!licensePlate) {
        return res.status(400).json({
          success: false,
          error: 'La matrícula es requerida',
        });
      }

      // Buscar sesión activa del vehículo
      const session = await sessionRepository.createQueryBuilder("session")
        .innerJoin("session.vehicle", "vehicle")
        .where("vehicle.license_plate = :plate", { plate: licensePlate })
        .andWhere("session.status = :status", { status: 'PARKED' })
        .getOne();

        console.log(session);
        

      if (!session) {
 
        // Error 404
        return res.status(404).json({
          success: false,
          error: 'No se encontró una sesión de estacionamiento activa para esta patente.',
        });
      }

      // Crear pago en Klap
      const klapPayment = await klapService.createPayment({
        amount: parseInt(amount),
        description: description || 'Pago de estacionamiento',
        licensePlate: licensePlate,
        userEmail: email,
      });

      // Guardar registro de pago en BD
      const newPayment = new Payment();
      newPayment.order_id = klapPayment.orderId;
      newPayment.reference_id = klapPayment.referenceId;
      newPayment.amount = parseInt(amount);
      newPayment.status = 'PENDING';
      newPayment.parkingSession = session;

      await paymentRepository.save(newPayment);

      logger.info('Payment created and saved', {
        orderId: klapPayment.orderId,
        licensePlate,
        sessionId: session.id_parking_sessions
      });

      // Renderizar checkout embebido con el SDK de Klap
      res.render('checkout', {
        title: 'Realizar Pago',
        orderId: klapPayment.orderId,
        amount: parseInt(amount),
        description: description || 'Pago de estacionamiento',
        licensePlate: licensePlate,
      });
    } catch (error) {
      logger.error('Error creating payment', { error });
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
      message: req.query.message || 'Ocurrió un error al procesar el pago',
    });
  }
}