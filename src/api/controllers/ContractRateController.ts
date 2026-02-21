import { Request, Response } from 'express';
import { ContractRate } from '../../models/ContractRate';
import { ContractType } from '../../models/ContractType';
import { ContractRateConfig } from '../../models/ContractRateConfig';
import { Logger } from '../../shared/utils/logger';

const logger = new Logger('ContractRateController');

export class ContractRateController {
    /**
     * GET /api/v1/contract-rates
     * Listar todas las tarifas de contrato
     */
    static async getAll(req: Request, res: Response) {
        try {
            const contractRates = await ContractRate.findAll({
                include: [{ model: ContractType }, { model: ContractRateConfig }],
            });

            res.json({
                success: true,
                data: contractRates,
            });
        } catch (error) {
            logger.error('Error getting contract rates', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener tarifas de contrato',
            });
        }
    }

    /**
     * GET /api/v1/contract-rates/:id
     * Obtener una tarifa de contrato por ID
     */
    static async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const contractRate = await ContractRate.findByPk(parseInt(id), {
                include: [{ model: ContractType }],
            });

            if (!contractRate) {
                return res.status(404).json({
                    success: false,
                    error: 'Tarifa de contrato no encontrada',
                });
            }

            res.json({
                success: true,
                data: contractRate,
            });
        } catch (error) {
            logger.error('Error getting contract rate', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener tarifa de contrato',
            });
        }
    }

    /**
     * POST /api/v1/contract-rates
     * Crear una nueva tarifa de contrato
     */
    static async create(req: Request, res: Response) {
        try {
            const {
                month_amount,
                exit_charge,
                is_active,
                end_date,
                id_contract_types,
                id_contract_rate_configs,
            } = req.body;

            if (!id_contract_types) {
                return res.status(400).json({
                    success: false,
                    error: 'El tipo de contrato es obligatorio',
                });
            }

            if (!id_contract_rate_configs) {
                return res.status(400).json({
                    success: false,
                    error: 'El tipo de contrato config es obligatorio',
                });
            }

            const contractRate = await ContractRate.create({
                month_amount,
                exit_charge,
                is_active,
                start_date: new Date().toISOString().split('T')[0],
                //end_date,
                id_contract_types,
                id_contract_rate_configs
            });

            res.status(201).json({
                success: true,
                data: contractRate,
            });
        } catch (error) {
            logger.error('Error creating contract rate', { error });
            res.status(500).json({
                success: false,
                error: 'Error al crear tarifa de contrato',
            });
        }
    }

    /**
     * PUT /api/v1/contract-rates/:id
     * Actualizar una tarifa de contrato
     */
    static async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const {
                month_amount,
                exit_charge,
                is_active,
                end_date,
                id_contract_types,
                id_contract_rate_configs
            } = req.body;

            const contractRate = await ContractRate.findByPk(parseInt(id));

            if (!contractRate) {
                return res.status(404).json({
                    success: false,
                    error: 'Tarifa de contrato no encontrada',
                });
            }

            if (!id_contract_types) {
                return res.status(400).json({
                    success: false,
                    error: 'El tipo de contrato es obligatorio',
                });
            }

            if (!id_contract_rate_configs) {
                return res.status(400).json({
                    success: false,
                    error: 'El tipo de contrato config es obligatorio',
                });
            }

            await contractRate.update({
                month_amount,
                exit_charge,
                is_active,
               // end_date,
                id_contract_types,
                id_contract_rate_configs
            });

            res.json({
                success: true,
                data: contractRate,
            });
        } catch (error) {
            logger.error('Error updating contract rate', { error });
            res.status(500).json({
                success: false,
                error: 'Error al actualizar tarifa de contrato',
            });
        }
    }

    /**
     * DELETE /api/v1/contract-rates/:id
     * Eliminar una tarifa de contrato
     */
    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const contractRate = await ContractRate.findByPk(parseInt(id));

            if (!contractRate) {
                return res.status(404).json({
                    success: false,
                    error: 'Tarifa de contrato no encontrada',
                });
            }

            await contractRate.destroy();

            res.json({
                success: true,
                message: 'Tarifa de contrato eliminada correctamente',
            });
        } catch (error) {
            logger.error('Error deleting contract rate', { error });
            res.status(500).json({
                success: false,
                error: 'Error al eliminar tarifa de contrato',
            });
        }
    }
}
