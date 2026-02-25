import { Request, Response } from 'express';
import { PaymentLink } from '../../models/PaymentLink';
import { Payment } from '../../models/Payment';
import { Logger } from '../../shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';

const logger = new Logger('PaymentLinkController');

export class PaymentLinkController {

    /**
     * GET /api/v1/payment-links
     * Listar todos los links de pago
     */
    static async getAll(req: Request, res: Response) {
        try {
            const { is_used } = req.query;

            const where: any = {};
            if (is_used !== undefined) where.is_used = parseInt(is_used as string);

            const links = await PaymentLink.findAll({
                where,
                include: [{ model: Payment }],
                order: [['created_at', 'DESC']]
            });

            res.json({
                success: true,
                data: links
            });
        } catch (error) {
            logger.error('Error getting payment links', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener links de pago'
            });
        }
    }

    /**
     * GET /api/v1/payment-links/:id
     * Obtener un link de pago por ID
     */
    static async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const link = await PaymentLink.findByPk(parseInt(id), {
                include: [{ model: Payment }]
            });

            if (!link) {
                return res.status(404).json({
                    success: false,
                    error: 'Link de pago no encontrado'
                });
            }

            res.json({
                success: true,
                data: link
            });
        } catch (error) {
            logger.error('Error getting payment link', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener link de pago'
            });
        }
    }

    /**
     * GET /api/v1/payment-links/by-code/:code
     * Obtener un link de pago por link_code
     */
    static async getByCode(req: Request, res: Response) {
        try {
            const { code } = req.params;
            const link = await PaymentLink.findOne({
                where: { link_code: code },
                include: [{ model: Payment }]
            });

            if (!link) {
                return res.status(404).json({
                    success: false,
                    error: 'Link de pago no encontrado'
                });
            }

            res.json({
                success: true,
                data: {
                    ...link.toJSON(),
                    is_expired: link.isExpired(),
                    is_valid: link.isValid()
                }
            });
        } catch (error) {
            logger.error('Error getting payment link by code', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener link de pago'
            });
        }
    }

    /**
     * POST /api/v1/payment-links
     * Crear un nuevo link de pago
     */
    static async create(req: Request, res: Response) {
        try {
            const {
                order_id,
                reference_id,
                mc_code,
                link_code,
                expires_at,
                id_payments
            } = req.body;

            if (!order_id) {
                return res.status(400).json({
                    success: false,
                    error: 'El order_id es obligatorio'
                });
            }

            if (!reference_id) {
                return res.status(400).json({
                    success: false,
                    error: 'El reference_id es obligatorio'
                });
            }

            if (!id_payments) {
                return res.status(400).json({
                    success: false,
                    error: 'El pago asociado es obligatorio'
                });
            }

            const payment = await Payment.findByPk(id_payments);
            if (!payment) {
                return res.status(404).json({
                    success: false,
                    error: 'Pago no encontrado'
                });
            }

            const generatedCode = link_code || uuidv4();

            const link = await PaymentLink.create({
                order_id,
                reference_id,
                mc_code: mc_code || null,
                link_code: generatedCode,
                is_used: 0,
                expires_at: expires_at ? new Date(expires_at) : new Date(Date.now() + 30 * 60 * 1000),
                created_at: new Date(),
                id_payments
            });

            const created = await PaymentLink.findByPk(link.id_payment_links, {
                include: [{ model: Payment }]
            });

            logger.info('Payment link created', { id: link.id_payment_links, code: generatedCode });

            res.status(201).json({
                success: true,
                data: created
            });
        } catch (error) {
            logger.error('Error creating payment link', { error });
            res.status(500).json({
                success: false,
                error: 'Error al crear link de pago'
            });
        }
    }

    /**
     * PUT /api/v1/payment-links/:id
     * Actualizar un link de pago
     */
    static async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { mc_code, is_used, expires_at } = req.body;

            const link = await PaymentLink.findByPk(parseInt(id));

            if (!link) {
                return res.status(404).json({
                    success: false,
                    error: 'Link de pago no encontrado'
                });
            }

            await link.update({
                ...(mc_code !== undefined && { mc_code }),
                ...(is_used !== undefined && { is_used }),
                ...(expires_at !== undefined && { expires_at: new Date(expires_at) })
            });

            res.json({
                success: true,
                data: link
            });
        } catch (error) {
            logger.error('Error updating payment link', { error });
            res.status(500).json({
                success: false,
                error: 'Error al actualizar link de pago'
            });
        }
    }

    /**
     * PATCH /api/v1/payment-links/:id/use
     * Marcar un link de pago como usado
     */
    static async markAsUsed(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { mc_code } = req.body;

            const link = await PaymentLink.findByPk(parseInt(id));

            if (!link) {
                return res.status(404).json({
                    success: false,
                    error: 'Link de pago no encontrado'
                });
            }

            if (link.is_used) {
                return res.status(409).json({
                    success: false,
                    error: 'El link de pago ya fue utilizado'
                });
            }

            if (link.isExpired()) {
                return res.status(409).json({
                    success: false,
                    error: 'El link de pago está expirado'
                });
            }

            await link.update({
                is_used: 1,
                ...(mc_code && { mc_code })
            });

            logger.info('Payment link marked as used', { id: link.id_payment_links });

            res.json({
                success: true,
                message: 'Link de pago marcado como utilizado',
                data: link
            });
        } catch (error) {
            logger.error('Error marking payment link as used', { error });
            res.status(500).json({
                success: false,
                error: 'Error al actualizar link de pago'
            });
        }
    }

    /**
     * DELETE /api/v1/payment-links/:id
     * Eliminar un link de pago
     */
    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const link = await PaymentLink.findByPk(parseInt(id));

            if (!link) {
                return res.status(404).json({
                    success: false,
                    error: 'Link de pago no encontrado'
                });
            }

            await link.destroy();

            res.json({
                success: true,
                message: 'Link de pago eliminado correctamente'
            });
        } catch (error) {
            logger.error('Error deleting payment link', { error });
            res.status(500).json({
                success: false,
                error: 'Error al eliminar link de pago'
            });
        }
    }
}
