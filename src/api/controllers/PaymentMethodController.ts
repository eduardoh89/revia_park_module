import { Request, Response } from 'express';
import { PaymentMethod } from '../../models/PaymentMethod';
import { Logger } from '../../shared/utils/logger';

const logger = new Logger('PaymentMethodController');

export class PaymentMethodController {

    /**
     * GET /api/v1/payment-methods
     * Listar todos los métodos de pago
     */
    static async getAll(req: Request, res: Response) {
        try {
            const { is_active } = req.query;

            const where: any = {};
            if (is_active !== undefined) where.is_active = parseInt(is_active as string);

            const methods = await PaymentMethod.findAll({ where });

            res.json({
                success: true,
                data: methods
            });
        } catch (error) {
            logger.error('Error getting payment methods', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener métodos de pago'
            });
        }
    }

    /**
     * GET /api/v1/payment-methods/:id
     * Obtener un método de pago por ID
     */
    static async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const method = await PaymentMethod.findByPk(parseInt(id));

            if (!method) {
                return res.status(404).json({
                    success: false,
                    error: 'Método de pago no encontrado'
                });
            }

            res.json({
                success: true,
                data: method
            });
        } catch (error) {
            logger.error('Error getting payment method', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener método de pago'
            });
        }
    }

    /**
     * POST /api/v1/payment-methods
     * Crear un nuevo método de pago
     */
    static async create(req: Request, res: Response) {
        try {
            const { code, name, is_active } = req.body;

            if (!name) {
                return res.status(400).json({
                    success: false,
                    error: 'El nombre es obligatorio'
                });
            }

            const method = await PaymentMethod.create({
                code: code || null,
                name,
                is_active: is_active ?? 1
            });

            logger.info('Payment method created', { id: method.id_payment_methods });

            res.status(201).json({
                success: true,
                data: method
            });
        } catch (error) {
            logger.error('Error creating payment method', { error });
            res.status(500).json({
                success: false,
                error: 'Error al crear método de pago'
            });
        }
    }

    /**
     * PUT /api/v1/payment-methods/:id
     * Actualizar un método de pago
     */
    static async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { code, name, is_active } = req.body;

            const method = await PaymentMethod.findByPk(parseInt(id));

            if (!method) {
                return res.status(404).json({
                    success: false,
                    error: 'Método de pago no encontrado'
                });
            }

            if (name !== undefined && !name) {
                return res.status(400).json({
                    success: false,
                    error: 'El nombre no puede estar vacío'
                });
            }

            await method.update({
                ...(code !== undefined && { code }),
                ...(name !== undefined && { name }),
                ...(is_active !== undefined && { is_active })
            });

            res.json({
                success: true,
                data: method
            });
        } catch (error) {
            logger.error('Error updating payment method', { error });
            res.status(500).json({
                success: false,
                error: 'Error al actualizar método de pago'
            });
        }
    }

    /**
     * DELETE /api/v1/payment-methods/:id
     * Eliminar un método de pago
     */
    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const method = await PaymentMethod.findByPk(parseInt(id));

            if (!method) {
                return res.status(404).json({
                    success: false,
                    error: 'Método de pago no encontrado'
                });
            }

            await method.destroy();

            res.json({
                success: true,
                message: 'Método de pago eliminado correctamente'
            });
        } catch (error) {
            logger.error('Error deleting payment method', { error });
            res.status(500).json({
                success: false,
                error: 'Error al eliminar método de pago'
            });
        }
    }
}
