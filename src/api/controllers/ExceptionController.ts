import { Request, Response } from 'express';
import { Exception } from '../../models/Exception';
import { ExceptionType } from '../../models/ExceptionType';
import { ParkingLot } from '../../models/ParkingLot';
import { ParkingSession } from '../../models/ParkingSession';
import { Payment } from '../../models/Payment';
import { Contract } from '../../models/Contract';
import { Logger } from '../../shared/utils/logger';

const logger = new Logger('ExceptionController');

const defaultIncludes = [
    { model: ExceptionType },
    { model: ParkingLot },
    { model: ParkingSession, required: false },
    { model: Payment, required: false },
    { model: Contract, required: false }
];

export class ExceptionController {

    /**
     * GET /api/v1/exceptions
     */
    static async getAll(req: Request, res: Response) {
        try {
            const { status, id_parking_lots, id_exception_types } = req.query;
            const where: any = {};
            if (status) where.status = status;
            if (id_parking_lots) where.id_parking_lots = parseInt(id_parking_lots as string);
            if (id_exception_types) where.id_exception_types = parseInt(id_exception_types as string);

            const exceptions = await Exception.findAll({
                where,
                include: defaultIncludes,
                order: [['id_exceptions', 'DESC']]
            });

            res.json({ success: true, data: exceptions });
        } catch (error) {
            logger.error('Error getting exceptions', { error });
            res.status(500).json({ success: false, error: 'Error al obtener excepciones' });
        }
    }

    /**
     * GET /api/v1/exceptions/:id
     */
    static async getById(req: Request, res: Response) {
        try {
            const exception = await Exception.findByPk(parseInt(req.params.id), {
                include: defaultIncludes
            });

            if (!exception) {
                return res.status(404).json({ success: false, error: 'Excepción no encontrada' });
            }

            res.json({ success: true, data: exception });
        } catch (error) {
            logger.error('Error getting exception', { error });
            res.status(500).json({ success: false, error: 'Error al obtener excepción' });
        }
    }

    /**
     * POST /api/v1/exceptions
     */
    static async create(req: Request, res: Response) {
        try {
            const {
                created_by,
                id_exception_types,
                id_parking_lots,
                id_parking_sessions,
                id_payments,
                id_contracts,
                notes,
                evidence_url,
                metadata,
                id_users_reporter
            } = req.body;

            if (!created_by || !id_exception_types || !id_parking_lots) {
                return res.status(400).json({
                    success: false,
                    error: 'created_by, id_exception_types e id_parking_lots son obligatorios'
                });
            }

            const exceptionType = await ExceptionType.findByPk(id_exception_types);
            if (!exceptionType) {
                return res.status(404).json({ success: false, error: 'Tipo de excepción no encontrado' });
            }

            const parkingLot = await ParkingLot.findByPk(id_parking_lots);
            if (!parkingLot) {
                return res.status(404).json({ success: false, error: 'Estacionamiento no encontrado' });
            }

            const exception = await Exception.create({
                created_by,
                status: 'OPEN',
                occurred_at: new Date(),
                id_exception_types,
                id_parking_lots,
                id_parking_sessions: id_parking_sessions || null,
                id_payments: id_payments || null,
                id_contracts: id_contracts || null,
                notes: notes || null,
                evidence_url: evidence_url || null,
                metadata: metadata || null,
                id_users_reporter: id_users_reporter || null
            });

            const created = await Exception.findByPk(exception.id_exceptions, { include: defaultIncludes });

            logger.info('Exception created', { id: exception.id_exceptions });
            res.status(201).json({ success: true, data: created });
        } catch (error) {
            logger.error('Error creating exception', { error });
            res.status(500).json({ success: false, error: 'Error al crear excepción' });
        }
    }

    /**
     * PUT /api/v1/exceptions/:id
     */
    static async update(req: Request, res: Response) {
        try {
            const exception = await Exception.findByPk(parseInt(req.params.id));
            if (!exception) {
                return res.status(404).json({ success: false, error: 'Excepción no encontrada' });
            }

            const {
                notes,
                evidence_url,
                metadata,
                id_users_reporter,
                id_users_authorizer
            } = req.body;

            await exception.update({
                ...(notes !== undefined && { notes }),
                ...(evidence_url !== undefined && { evidence_url }),
                ...(metadata !== undefined && { metadata }),
                ...(id_users_reporter !== undefined && { id_users_reporter }),
                ...(id_users_authorizer !== undefined && { id_users_authorizer })
            });

            const updated = await Exception.findByPk(exception.id_exceptions, { include: defaultIncludes });
            res.json({ success: true, data: updated });
        } catch (error) {
            logger.error('Error updating exception', { error });
            res.status(500).json({ success: false, error: 'Error al actualizar excepción' });
        }
    }

    /**
     * PATCH /api/v1/exceptions/:id/resolve
     * Aprobar o rechazar una excepción
     */
    static async resolve(req: Request, res: Response) {
        try {
            const exception = await Exception.findByPk(parseInt(req.params.id));
            if (!exception) {
                return res.status(404).json({ success: false, error: 'Excepción no encontrada' });
            }

            if (exception.status !== 'OPEN') {
                return res.status(409).json({ success: false, error: 'La excepción ya fue resuelta' });
            }

            const { status, id_users_authorizer, notes } = req.body;

            if (!status || !['RESOLVED', 'ESCALATED'].includes(status)) {
                return res.status(400).json({ success: false, error: 'status debe ser RESOLVED o ESCALATED' });
            }

            await exception.update({
                status,
                resolved_at: new Date(),
                id_users_authorizer: id_users_authorizer || null,
                ...(notes !== undefined && { notes })
            });

            const updated = await Exception.findByPk(exception.id_exceptions, { include: defaultIncludes });

            logger.info('Exception resolved', { id: exception.id_exceptions, status });
            res.json({ success: true, data: updated });
        } catch (error) {
            logger.error('Error resolving exception', { error });
            res.status(500).json({ success: false, error: 'Error al resolver excepción' });
        }
    }

    /**
     * DELETE /api/v1/exceptions/:id
     */
    static async delete(req: Request, res: Response) {
        try {
            const exception = await Exception.findByPk(parseInt(req.params.id));
            if (!exception) {
                return res.status(404).json({ success: false, error: 'Excepción no encontrada' });
            }

            if (exception.status === 'OPEN') {
                return res.status(409).json({ success: false, error: 'No se puede eliminar una excepción abierta' });
            }

            await exception.destroy();
            res.json({ success: true, message: 'Excepción eliminada correctamente' });
        } catch (error) {
            logger.error('Error deleting exception', { error });
            res.status(500).json({ success: false, error: 'Error al eliminar excepción' });
        }
    }
}
