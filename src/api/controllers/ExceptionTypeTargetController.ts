import { Request, Response } from 'express';
import { ExceptionTypeTarget } from '../../models/ExceptionTypeTarget';
import { Logger } from '../../shared/utils/logger';

const logger = new Logger('ExceptionTypeTargetController');

export class ExceptionTypeTargetController {

    /**
     * GET /api/v1/exception-type-targets
     */
    static async getAll(req: Request, res: Response) {
        try {
            const targets = await ExceptionTypeTarget.findAll({
                order: [['name', 'ASC']]
            });

            res.json({ success: true, data: targets });
        } catch (error) {
            logger.error('Error getting exception type targets', { error });
            res.status(500).json({ success: false, error: 'Error al obtener targets de tipo de excepción' });
        }
    }
}
