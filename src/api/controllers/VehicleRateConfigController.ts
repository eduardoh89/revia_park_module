import { Request, Response } from 'express';
import { VehicleRateConfig } from '../../models/VehicleRateConfig';
import { Logger } from '../../shared/utils/logger';

const logger = new Logger('VehicleRateConfigController');

export class VehicleRateConfigController {
    /**
     * GET /api/v1/vehicle-rate-configs
     * Listar todas las configuraciones de tarifa
     */
    static async getAll(req: Request, res: Response) {
        try {
            const configs = await VehicleRateConfig.findAll();

            res.json({
                success: true,
                data: configs,
            });
        } catch (error) {
            logger.error('Error getting vehicle rate configs', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener configuraciones de tarifa',
            });
        }
    }
}
