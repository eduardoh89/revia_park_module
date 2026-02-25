import { Request, Response, NextFunction } from 'express';
import { Payment } from '../../models/Payment';
import { PaymentLink } from '../../models/PaymentLink';
import { PaymentMethod } from '../../models/PaymentMethod';
import { ParkingSession } from '../../models/ParkingSession';
import { Vehicle } from '../../models/Vehicle';
import { Logger } from '../../shared/utils/logger';
import { PaymentLinkService } from '../../whatsapp/services/PaymentLinkService';

const logger = new Logger('PaymentController');
const paymentLinkService = new PaymentLinkService();

export class PaymentController {

    /**
     * GET /api/v1/payments
     * Listar todos los pagos
     */
    static async getAll(req: Request, res: Response) {
        try {
            const { status, id_parking_sessions } = req.query;

            const where: any = {};
            if (status) where.status = status;
            if (id_parking_sessions) where.id_parking_sessions = parseInt(id_parking_sessions as string);

            const payments = await Payment.findAll({
                where,
                include: [
                    { model: ParkingSession },
                    { model: PaymentMethod }
                ],
                order: [['created_at', 'DESC']]
            });

            res.json({
                success: true,
                data: payments
            });
        } catch (error) {
            logger.error('Error getting payments', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener pagos'
            });
        }
    }

    /**
     * GET /api/v1/payments/:id
     * Obtener un pago por ID
     */
    static async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const payment = await Payment.findByPk(parseInt(id), {
                include: [
                    { model: ParkingSession },
                    { model: PaymentMethod }
                ]
            });

            if (!payment) {
                return res.status(404).json({
                    success: false,
                    error: 'Pago no encontrado'
                });
            }

            res.json({
                success: true,
                data: payment
            });
        } catch (error) {
            logger.error('Error getting payment', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener pago'
            });
        }
    }

    /**
     * POST /api/v1/payments
     * Crear un nuevo pago
     */
    static async create(req: Request, res: Response) {
        try {
            const { amount, order_id, status, mc_code, id_parking_sessions, id_payment_methods, id_users } = req.body;

            if (!amount || amount <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'El monto es obligatorio y debe ser mayor a 0'
                });
            }

            if (!order_id) {
                return res.status(400).json({
                    success: false,
                    error: 'El order_id es obligatorio'
                });
            }

            if (!id_parking_sessions) {
                return res.status(400).json({
                    success: false,
                    error: 'La sesión de estacionamiento es obligatoria'
                });
            }

            if (!id_payment_methods) {
                return res.status(400).json({
                    success: false,
                    error: 'El método de pago es obligatorio'
                });
            }

            const session = await ParkingSession.findByPk(id_parking_sessions);
            if (!session) {
                return res.status(404).json({
                    success: false,
                    error: 'Sesión de estacionamiento no encontrada'
                });
            }

            const paymentMethod = await PaymentMethod.findByPk(id_payment_methods);
            if (!paymentMethod) {
                return res.status(404).json({
                    success: false,
                    error: 'Método de pago no encontrado'
                });
            }

            const payment = await Payment.create({
                amount,
                order_id,
                status: status || 'PENDING',
                mc_code: mc_code || null,
                created_at: new Date(),
                id_parking_sessions,
                id_payment_methods,
                id_users: id_users || null
            });

            const created = await Payment.findByPk(payment.id_payments, {
                include: [
                    { model: ParkingSession },
                    { model: PaymentMethod }
                ]
            });

            logger.info('Payment created', { id: payment.id_payments });

            res.status(201).json({
                success: true,
                data: created
            });
        } catch (error) {
            logger.error('Error creating payment', { error });
            res.status(500).json({
                success: false,
                error: 'Error al crear pago'
            });
        }
    }

    /**
     * PUT /api/v1/payments/:id
     * Actualizar un pago
     */
    static async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status, mc_code, completed_at } = req.body;

            const payment = await Payment.findByPk(parseInt(id));

            if (!payment) {
                return res.status(404).json({
                    success: false,
                    error: 'Pago no encontrado'
                });
            }

            await payment.update({
                ...(status !== undefined && { status }),
                ...(mc_code !== undefined && { mc_code }),
                ...(completed_at !== undefined && { completed_at: new Date(completed_at) })
            });

            const updated = await Payment.findByPk(payment.id_payments, {
                include: [
                    { model: ParkingSession },
                    { model: PaymentMethod }
                ]
            });

            res.json({
                success: true,
                data: updated
            });
        } catch (error) {
            logger.error('Error updating payment', { error });
            res.status(500).json({
                success: false,
                error: 'Error al actualizar pago'
            });
        }
    }

    /**
     * DELETE /api/v1/payments/:id
     * Eliminar un pago
     */
    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const payment = await Payment.findByPk(parseInt(id));

            if (!payment) {
                return res.status(404).json({
                    success: false,
                    error: 'Pago no encontrado'
                });
            }

            if (payment.status === 'COMPLETED') {
                return res.status(409).json({
                    success: false,
                    error: 'No se puede eliminar un pago completado'
                });
            }

            await payment.destroy();

            res.json({
                success: true,
                message: 'Pago eliminado correctamente'
            });
        } catch (error) {
            logger.error('Error deleting payment', { error });
            res.status(500).json({
                success: false,
                error: 'Error al eliminar pago'
            });
        }
    }

    /**
     * POST /api/v1/payments/create-link
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

            const vehicle = await Vehicle.findOne({
                where: { license_plate: licensePlate }
            });

            if (!vehicle) {
                return res.status(404).json({
                    success: false,
                    error: 'Vehículo no encontrado',
                });
            }

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

            // Genera pago + link usando la lógica de VehicleRate/VehicleRateConfig
            const result = await paymentLinkService.createPaymentLink(
                licensePlate,
                session.id_parking_sessions
            );

            logger.info('Payment link created', {
                licensePlate,
                linkCode: result.linkCode,
                expiresAt: result.expiresAt,
                paymentUrl: result.paymentUrl
            });

            res.json({
                success: true,
                data: {
                    paymentUrl: result.paymentUrl,
                    expiresAt: result.expiresAt,
                    amount: result.amount,
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

            const paymentLink = await PaymentLink.findOne({
                where: { link_code: code },
                include: [{
                    model: Payment,
                    include: [{
                        model: ParkingSession,
                        include: [{ model: Vehicle, as: 'vehicle' }]
                    }]
                }]
            });

            if (!paymentLink) {
                return res.status(404).render('result', {
                    title: 'Error',
                    type: 'error',
                    message: 'Link de pago no encontrado',
                });
            }

            if (paymentLink.is_used) {
                return res.status(410).render('result', {
                    title: 'Link Usado',
                    type: 'error',
                    message: 'Este link de pago ya fue utilizado',
                });
            }

            if (paymentLink.isExpired()) {
                return res.status(410).render('result', {
                    title: 'Link Expirado',
                    type: 'error',
                    message: 'Este link de pago ha expirado. Por favor solicita uno nuevo.',
                });
            }

            await paymentLink.update({ is_used: 1 });

            const payment = paymentLink.payment;
            const session = payment.parkingSession;
            const vehicle = await Vehicle.findByPk(session.id_vehicles);

            logger.info('Payment checkout accessed', {
                linkCode: code,
                orderId: payment.order_id,
                licensePlate: vehicle?.license_plate
            });

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
