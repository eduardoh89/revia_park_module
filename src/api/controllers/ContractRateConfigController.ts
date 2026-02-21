import { Request, Response } from 'express';
import { ContractRateConfig } from '../../models/ContractRateConfig';
import { Logger } from '../../shared/utils/logger';

const logger = new Logger('ContractRateConfigController');

export class ContractRateConfigController {
    /**
     * GET /api/v1/contract-rate-configs
     * Listar todas las configuraciones de tarifa de contrato
     */
    static async getAll(req: Request, res: Response) {
        try {
            const configs = await ContractRateConfig.findAll();

            res.json({
                success: true,
                data: configs,
            });
        } catch (error) {
            logger.error('Error getting contract rate configs', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener configuraciones de tarifa de contrato',
            });
        }
    }
}
