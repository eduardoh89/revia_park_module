import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { CreditNote } from '../../models/CreditNote';
import { Payment } from '../../models/Payment';
import { User } from '../../models/User';
import { Logger } from '../../shared/utils/logger';

const logger = new Logger('CreditNoteController');

export class CreditNoteController {

    /**
     * GET /api/v1/credit-notes
     * Listar todas las notas de crédito
     */
    static async getAll(req: Request, res: Response) {
        try {
            const notes = await CreditNote.findAll({
                include: [
                    { model: Payment, as: 'originalPayment' },
                    { model: Payment, as: 'newPayment', required: false },
                    { model: User }
                ],
                order: [['created_at', 'DESC']]
            });

            res.json({
                success: true,
                data: notes
            });
        } catch (error) {
            logger.error('Error getting credit notes', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener notas de crédito'
            });
        }
    }

    /**
     * GET /api/v1/credit-notes/:id
     * Obtener una nota de crédito por ID
     */
    static async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const note = await CreditNote.findByPk(parseInt(id), {
                include: [
                    { model: Payment, as: 'originalPayment' },
                    { model: Payment, as: 'newPayment', required: false },
                    { model: User }
                ]
            });

            if (!note) {
                return res.status(404).json({
                    success: false,
                    error: 'Nota de crédito no encontrada'
                });
            }

            res.json({
                success: true,
                data: note
            });
        } catch (error) {
            logger.error('Error getting credit note', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener nota de crédito'
            });
        }
    }

    /**
     * POST /api/v1/credit-notes
     * Crear una nueva nota de crédito
     */
    static async create(req: Request, res: Response) {
        try {
            const { amount, note, status, refund_method, id_payments_original, id_payments_new, id_users } = req.body;

            if (!amount || amount <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'El monto es obligatorio y debe ser mayor a 0'
                });
            }

            if (!refund_method) {
                return res.status(400).json({
                    success: false,
                    error: 'El método de devolución es obligatorio (CASH, TRANSFER, OTHER)'
                });
            }

            if (!id_users) {
                return res.status(400).json({
                    success: false,
                    error: 'El usuario es obligatorio'
                });
            }

            if (!id_payments_original) {
                return res.status(400).json({
                    success: false,
                    error: 'El pago original es obligatorio'
                });
            }

            const originalPayment = await Payment.findByPk(id_payments_original);
            if (!originalPayment) {
                return res.status(404).json({
                    success: false,
                    error: 'Pago original no encontrado'
                });
            }

            if (id_payments_new) {
                const newPayment = await Payment.findByPk(id_payments_new);
                if (!newPayment) {
                    return res.status(404).json({
                        success: false,
                        error: 'Nuevo pago no encontrado'
                    });
                }
            }

            const creditNote = await CreditNote.create({
                amount,
                note: note || null,
                created_at: new Date(),
                status: status || 'PENDING',
                refund_method,
                id_payments_original,
                id_payments_new: id_payments_new || null,
                id_users
            });

            const created = await CreditNote.findByPk(creditNote.id_credit_notes, {
                include: [
                    { model: Payment, as: 'originalPayment' },
                    { model: Payment, as: 'newPayment', required: false },
                    { model: User }
                ]
            });

            logger.info('Credit note created', { id: creditNote.id_credit_notes });

            res.status(201).json({
                success: true,
                data: created
            });
        } catch (error) {
            logger.error('Error creating credit note', { error });
            res.status(500).json({
                success: false,
                error: 'Error al crear nota de crédito'
            });
        }
    }

    /**
     * PUT /api/v1/credit-notes/:id
     * Actualizar una nota de crédito
     */
    static async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { amount, note, status, refund_method, id_payments_new, id_users } = req.body;

            const creditNote = await CreditNote.findByPk(parseInt(id));

            if (!creditNote) {
                return res.status(404).json({
                    success: false,
                    error: 'Nota de crédito no encontrada'
                });
            }

            if (amount !== undefined && amount <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'El monto debe ser mayor a 0'
                });
            }

            if (id_payments_new) {
                const newPayment = await Payment.findByPk(id_payments_new);
                if (!newPayment) {
                    return res.status(404).json({
                        success: false,
                        error: 'Nuevo pago no encontrado'
                    });
                }
            }

            await creditNote.update({
                ...(amount !== undefined && { amount }),
                ...(note !== undefined && { note }),
                ...(status !== undefined && { status }),
                ...(refund_method !== undefined && { refund_method }),
                ...(id_payments_new !== undefined && { id_payments_new }),
                ...(id_users !== undefined && { id_users })
            });

            const updated = await CreditNote.findByPk(creditNote.id_credit_notes, {
                include: [
                    { model: Payment, as: 'originalPayment' },
                    { model: Payment, as: 'newPayment', required: false },
                    { model: User }
                ]
            });

            res.json({
                success: true,
                data: updated
            });
        } catch (error) {
            logger.error('Error updating credit note', { error });
            res.status(500).json({
                success: false,
                error: 'Error al actualizar nota de crédito'
            });
        }
    }

    /**
     * POST /api/v1/credit-notes/filter
     * Filtrar notas de crédito por status, refund_method y rango de fechas
     */
    static async filterCreditNotes(req: Request, res: Response) {
        try {
            const { status, refund_method, date_from, date_to } = req.body;

            const where: any = {};

            if (status) where.status = status;
            if (refund_method) where.refund_method = refund_method;

            if (date_from || date_to) {
                const from = date_from ? new Date(`${date_from}T00:00:00.000Z`) : new Date(0);
                const to = date_to ? new Date(`${date_to}T23:59:59.999Z`) : new Date();
                where.created_at = { [Op.between]: [from, to] };
            }

            const notes = await CreditNote.findAll({
                where,
                include: [
                    { model: Payment, as: 'originalPayment' },
                    { model: Payment, as: 'newPayment', required: false },
                    { model: User }
                ],
                order: [['created_at', 'DESC']]
            });

            res.json({
                success: true,
                data: notes,
                count: notes.length
            });
        } catch (error) {
            logger.error('Error filtering credit notes', { error });
            res.status(500).json({
                success: false,
                error: 'No se pudieron filtrar las notas de crédito'
            });
        }
    }

    /**
     * DELETE /api/v1/credit-notes/:id
     * Eliminar una nota de crédito
     */
    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const creditNote = await CreditNote.findByPk(parseInt(id));

            if (!creditNote) {
                return res.status(404).json({
                    success: false,
                    error: 'Nota de crédito no encontrada'
                });
            }

            await creditNote.destroy();

            res.json({
                success: true,
                message: 'Nota de crédito eliminada correctamente'
            });
        } catch (error) {
            logger.error('Error deleting credit note', { error });
            res.status(500).json({
                success: false,
                error: 'Error al eliminar nota de crédito'
            });
        }
    }
}
