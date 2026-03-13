import { Request, Response } from 'express';
import { CreditNote } from '../../models/CreditNote';
import { Payment } from '../../models/Payment';
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
                    { model: Payment, as: 'newPayment', required: false }
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
                    { model: Payment, as: 'newPayment', required: false }
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
            const { amount, note, id_payments_original, id_payments_new, id_users } = req.body;

            if (!amount || amount <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'El monto es obligatorio y debe ser mayor a 0'
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
                id_payments_original,
                id_payments_new: id_payments_new || null,
                id_users: id_users || null
            });

            const created = await CreditNote.findByPk(creditNote.id_credit_notes, {
                include: [
                    { model: Payment, as: 'originalPayment' },
                    { model: Payment, as: 'newPayment', required: false }
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
            const { amount, note, id_payments_new, id_users } = req.body;

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
                ...(id_payments_new !== undefined && { id_payments_new }),
                ...(id_users !== undefined && { id_users })
            });

            const updated = await CreditNote.findByPk(creditNote.id_credit_notes, {
                include: [
                    { model: Payment, as: 'originalPayment' },
                    { model: Payment, as: 'newPayment', required: false }
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
