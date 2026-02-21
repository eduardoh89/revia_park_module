import { Request, Response } from 'express';
import { VehicleType } from '../../models/VehicleType';
import { Logger } from '../../shared/utils/logger';

const logger = new Logger('VehicleTypeController');

export class VehicleTypeController {
    /**
     * GET /api/v1/vehicle-types
     * Listar todos los tipos de vehículo
     */
    static async getAll(req: Request, res: Response) {
        try {
            const vehicleTypes = await VehicleType.findAll();

            res.json({
                success: true,
                data: vehicleTypes,
            });
        } catch (error) {
            logger.error('Error getting vehicle types', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener tipos de vehículo',
            });
        }
    }

    /**
     * GET /api/v1/vehicle-types/:id
     * Obtener un tipo de vehículo por ID
     */
    static async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const vehicleType = await VehicleType.findByPk(parseInt(id));

            if (!vehicleType) {
                return res.status(404).json({
                    success: false,
                    error: 'Tipo de vehículo no encontrado',
                });
            }

            res.json({
                success: true,
                data: {
                    id: vehicleType.id_vehicle_types,
                    name: vehicleType.name,
                    description: vehicleType.description,
                },
            });
        } catch (error) {
            logger.error('Error getting vehicle type', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener tipo de vehículo',
            });
        }
    }

    /**
     * POST /api/v1/vehicle-types
     * Crear un nuevo tipo de vehículo
     */
    static async create(req: Request, res: Response) {
        try {
            const { name, description } = req.body;

            if (!name) {
                return res.status(400).json({
                    success: false,
                    error: 'El nombre es obligatorio',
                });
            }

            const vehicleType = await VehicleType.create({ name, description });

            res.status(201).json({
                success: true,
                data: {
                    id: vehicleType.id_vehicle_types,
                    name: vehicleType.name,
                    description: vehicleType.description,
                },
            });
        } catch (error) {
            logger.error('Error creating vehicle type', { error });
            res.status(500).json({
                success: false,
                error: 'Error al crear tipo de vehículo',
            });
        }
    }

    /**
     * PUT /api/v1/vehicle-types/:id
     * Actualizar un tipo de vehículo
     */
    static async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, description } = req.body;

            const vehicleType = await VehicleType.findByPk(parseInt(id));

            if (!vehicleType) {
                return res.status(404).json({
                    success: false,
                    error: 'Tipo de vehículo no encontrado',
                });
            }

            if (!name) {
                return res.status(400).json({
                    success: false,
                    error: 'El nombre es obligatorio',
                });
            }

            await vehicleType.update({ name, description });

            res.json({
                success: true,
                data: {
                    id: vehicleType.id_vehicle_types,
                    name: vehicleType.name,
                    description: vehicleType.description,
                },
            });
        } catch (error) {
            logger.error('Error updating vehicle type', { error });
            res.status(500).json({
                success: false,
                error: 'Error al actualizar tipo de vehículo',
            });
        }
    }

    /**
     * DELETE /api/v1/vehicle-types/:id
     * Eliminar un tipo de vehículo
     */
    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const vehicleType = await VehicleType.findByPk(parseInt(id));

            if (!vehicleType) {
                return res.status(404).json({
                    success: false,
                    error: 'Tipo de vehículo no encontrado',
                });
            }

            await vehicleType.destroy();

            res.json({
                success: true,
                message: 'Tipo de vehículo eliminado correctamente',
            });
        } catch (error) {
            logger.error('Error deleting vehicle type', { error });
            res.status(500).json({
                success: false,
                error: 'Error al eliminar tipo de vehículo',
            });
        }
    }
}
