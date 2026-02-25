import { Request, Response } from 'express';
import { ExceptionType } from '../../models/ExceptionType';
import { Logger } from '../../shared/utils/logger';

const logger = new Logger('ExceptionTypeController');

export class ExceptionTypeController {

    /**
     * GET /api/v1/exception-types
     */
    static async getAll(req: Request, res: Response) {
        try {
            const { is_active } = req.query;
            const where: any = {};
            if (is_active !== undefined) where.is_active = parseInt(is_active as string);

            const types = await ExceptionType.findAll({ where, order: [['name', 'ASC']] });

            res.json({ success: true, data: types });
        } catch (error) {
            logger.error('Error getting exception types', { error });
            res.status(500).json({ success: false, error: 'Error al obtener tipos de excepción' });
        }
    }

    /**
     * GET /api/v1/exception-types/:id
     */
    static async getById(req: Request, res: Response) {
        try {
            const type = await ExceptionType.findByPk(parseInt(req.params.id));
            if (!type) {
                return res.status(404).json({ success: false, error: 'Tipo de excepción no encontrado' });
            }
            res.json({ success: true, data: type });
        } catch (error) {
            logger.error('Error getting exception type', { error });
            res.status(500).json({ success: false, error: 'Error al obtener tipo de excepción' });
        }
    }

    /**
     * POST /api/v1/exception-types
     */
    static async create(req: Request, res: Response) {
        try {
            const { code, name, requires_supervisor, requires_evidence, is_active, not_delete } = req.body;

            if (!code || !name) {
                return res.status(400).json({ success: false, error: 'code y name son obligatorios' });
            }

            const existing = await ExceptionType.findOne({ where: { code } });
            if (existing) {
                return res.status(409).json({ success: false, error: `Ya existe un tipo con el código "${code}"` });
            }

            const type = await ExceptionType.create({
                code,
                name,
                requires_supervisor: requires_supervisor ?? 0,
                requires_evidence: requires_evidence ?? 0,
                is_active: is_active ?? 1,
                not_delete: not_delete ?? 0
            });

            logger.info('Exception type created', { id: type.id_exception_types });
            res.status(201).json({ success: true, data: type });
        } catch (error) {
            logger.error('Error creating exception type', { error });
            res.status(500).json({ success: false, error: 'Error al crear tipo de excepción' });
        }
    }

    /**
     * PUT /api/v1/exception-types/:id
     */
    static async update(req: Request, res: Response) {
        try {
            const type = await ExceptionType.findByPk(parseInt(req.params.id));
            if (!type) {
                return res.status(404).json({ success: false, error: 'Tipo de excepción no encontrado' });
            }

            const { code, name, requires_supervisor, requires_evidence, is_active } = req.body;

            if (code && code !== type.code) {
                const existing = await ExceptionType.findOne({ where: { code } });
                if (existing) {
                    return res.status(409).json({ success: false, error: `Ya existe un tipo con el código "${code}"` });
                }
            }

            await type.update({
                ...(code !== undefined && { code }),
                ...(name !== undefined && { name }),
                ...(requires_supervisor !== undefined && { requires_supervisor }),
                ...(requires_evidence !== undefined && { requires_evidence }),
                ...(is_active !== undefined && { is_active })
            });

            res.json({ success: true, data: type });
        } catch (error) {
            logger.error('Error updating exception type', { error });
            res.status(500).json({ success: false, error: 'Error al actualizar tipo de excepción' });
        }
    }

    /**
     * DELETE /api/v1/exception-types/:id
     */
    static async delete(req: Request, res: Response) {
        try {
            const type = await ExceptionType.findByPk(parseInt(req.params.id));
            if (!type) {
                return res.status(404).json({ success: false, error: 'Tipo de excepción no encontrado' });
            }

            if (type.not_delete) {
                return res.status(409).json({ success: false, error: 'Este tipo de excepción no puede ser eliminado' });
            }

            await type.destroy();
            res.json({ success: true, message: 'Tipo de excepción eliminado correctamente' });
        } catch (error) {
            logger.error('Error deleting exception type', { error });
            res.status(500).json({ success: false, error: 'Error al eliminar tipo de excepción' });
        }
    }
}
