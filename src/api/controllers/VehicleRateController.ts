import { Request, Response } from 'express';
import { VehicleRate } from '../../models/VehicleRate';
import { VehicleType } from '../../models/VehicleType';
import { VehicleRateConfig } from '../../models/VehicleRateConfig';
import { Logger } from '../../shared/utils/logger';

const logger = new Logger('VehicleRateController');

export class VehicleRateController {
    /**
     * GET /api/v1/vehicle-rates
     * Listar todas las tarifas de vehículo
     */
    static async getAll(req: Request, res: Response) {
        try {
            const vehicleRates = await VehicleRate.findAll({
                include: [{ model: VehicleType }, { model: VehicleRateConfig }],
            });

            res.json({
                success: true,
                data: vehicleRates,
            });
        } catch (error) {
            logger.error('Error getting vehicle rates', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener tarifas de vehículo',
            });
        }
    }

    /**
     * GET /api/v1/vehicle-rates/:id
     * Obtener una tarifa de vehículo por ID
     */
    static async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const vehicleRate = await VehicleRate.findByPk(parseInt(id), {
                include: [{ model: VehicleType }, { model: VehicleRateConfig }],
            });

            if (!vehicleRate) {
                return res.status(404).json({
                    success: false,
                    error: 'Tarifa de vehículo no encontrada',
                });
            }

            res.json({
                success: true,
                data: vehicleRate,
            });
        } catch (error) {
            logger.error('Error getting vehicle rate', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener tarifa de vehículo',
            });
        }
    }

    /**
     * POST /api/v1/vehicle-rates
     * Crear una nueva tarifa de vehículo
     */
    static async create(req: Request, res: Response) {
        try {
            const {
                price_per_minute,
                daily_limit,
                block_duration_min,
                price_per_block,
                is_active,
               // start_date,
                end_date,
                id_vehicle_types,
                id_vehicle_rate_configs,
            } = req.body;

            // if (!start_date) {
            //     return res.status(400).json({
            //         success: false,
            //         error: 'La fecha de inicio es obligatoria',
            //     });
            // }

            if (!id_vehicle_types) {
                return res.status(400).json({
                    success: false,
                    error: 'El tipo de vehículo es obligatorio',
                });
            }

            const vehicleRate = await VehicleRate.create({
                price_per_minute,
                daily_limit,
                block_duration_min,
                price_per_block,
                is_active,
                start_date: new Date().toISOString().split('T')[0],
                end_date,
                id_vehicle_types,
                id_vehicle_rate_configs,
            });

            res.status(201).json({
                success: true,
                data: vehicleRate,
            });
        } catch (error) {
            logger.error('Error creating vehicle rate', { error });
            res.status(500).json({
                success: false,
                error: 'Error al crear tarifa de vehículo',
            });
        }
    }

    /**
     * PUT /api/v1/vehicle-rates/:id
     * Actualizar una tarifa de vehículo
     */
    static async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const {
                price_per_minute,
                daily_limit,
                block_duration_min,
                price_per_block,
                is_active,
                start_date,
                end_date,
                id_vehicle_types,
                id_vehicle_rate_configs,
            } = req.body;

            const vehicleRate = await VehicleRate.findByPk(parseInt(id));

            if (!vehicleRate) {
                return res.status(404).json({
                    success: false,
                    error: 'Tarifa de vehículo no encontrada',
                });
            }

            // if (!start_date) {
            //     return res.status(400).json({
            //         success: false,
            //         error: 'La fecha de inicio es obligatoria',
            //     });
            // }

            if (!id_vehicle_types) {
                return res.status(400).json({
                    success: false,
                    error: 'El tipo de vehículo es obligatorio',
                });
            }

            await vehicleRate.update({
                price_per_minute,
                daily_limit,
                block_duration_min,
                price_per_block,
                is_active,
               // start_date,
                end_date,
                id_vehicle_types,
                id_vehicle_rate_configs,
            });

            res.json({
                success: true,
                data: vehicleRate,
            });
        } catch (error) {
            logger.error('Error updating vehicle rate', { error });
            res.status(500).json({
                success: false,
                error: 'Error al actualizar tarifa de vehículo',
            });
        }
    }

    /**
     * DELETE /api/v1/vehicle-rates/:id
     * Eliminar una tarifa de vehículo
     */
    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const vehicleRate = await VehicleRate.findByPk(parseInt(id));

            if (!vehicleRate) {
                return res.status(404).json({
                    success: false,
                    error: 'Tarifa de vehículo no encontrada',
                });
            }

            await vehicleRate.destroy();

            res.json({
                success: true,
                message: 'Tarifa de vehículo eliminada correctamente',
            });
        } catch (error) {
            logger.error('Error deleting vehicle rate', { error });
            res.status(500).json({
                success: false,
                error: 'Error al eliminar tarifa de vehículo',
            });
        }
    }
}
