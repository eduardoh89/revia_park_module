import { Request, Response } from 'express';
import { ContractType } from '../../models/ContractType';
import { Logger } from '../../shared/utils/logger';

const logger = new Logger('ContractTypeController');

export class ContractTypeController {
    /**
     * GET /api/v1/contract-types
     * Listar todos los tipos de contrato
     */
    static async getAll(req: Request, res: Response) {
        try {
            const contractTypes = await ContractType.findAll();

            res.json({
                success: true,
                data: contractTypes,
            });
        } catch (error) {
            logger.error('Error getting contract types', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener tipos de contrato',
            });
        }
    }

    /**
     * GET /api/v1/contract-types/:id
     * Obtener un tipo de contrato por ID
     */
    static async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const contractType = await ContractType.findByPk(parseInt(id));

            if (!contractType) {
                return res.status(404).json({
                    success: false,
                    error: 'Tipo de contrato no encontrado',
                });
            }

            res.json({
                success: true,
                data: contractType,
            });
        } catch (error) {
            logger.error('Error getting contract type', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener tipo de contrato',
            });
        }
    }

    /**
     * POST /api/v1/contract-types
     * Crear un nuevo tipo de contrato
     */
    static async create(req: Request, res: Response) {
        try {
            const { code, name, description,max_vehicle } = req.body;
            console.log(req.body);
            

            if (!code) {
                return res.status(400).json({
                    success: false,
                    error: 'El código es obligatorio',
                });
            }

            if (!name) {
                return res.status(400).json({
                    success: false,
                    error: 'El nombre es obligatorio',
                });
            }

            const contractType = await ContractType.create({ code, name, description, is_active : 1,max_vehicle });

            res.status(201).json({
                success: true,
                data: contractType,
            });
        } catch (error) {
            logger.error('Error creating contract type', { error });
            res.status(500).json({
                success: false,
                error: 'Error al crear tipo de contrato',
            });
        }
    }

    /**
     * PUT /api/v1/contract-types/:id
     * Actualizar un tipo de contrato
     */
    static async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { code, name, description, is_active ,max_vehicle} = req.body;

            const contractType = await ContractType.findByPk(parseInt(id));

            if (!contractType) {
                return res.status(404).json({
                    success: false,
                    error: 'Tipo de contrato no encontrado',
                });
            }

            if (!code) {
                return res.status(400).json({
                    success: false,
                    error: 'El código es obligatorio',
                });
            }

            if (!name) {
                return res.status(400).json({
                    success: false,
                    error: 'El nombre es obligatorio',
                });
            }

            await contractType.update({ code, name, description, is_active,max_vehicle });

            res.json({
                success: true,
                data: contractType,
            });
        } catch (error) {
            logger.error('Error updating contract type', { error });
            res.status(500).json({
                success: false,
                error: 'Error al actualizar tipo de contrato',
            });
        }
    }

    /**
     * DELETE /api/v1/contract-types/:id
     * Eliminar un tipo de contrato
     */
    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const contractType = await ContractType.findByPk(parseInt(id));

            if (!contractType) {
                return res.status(404).json({
                    success: false,
                    error: 'Tipo de contrato no encontrado',
                });
            }

            await contractType.destroy();

            res.json({
                success: true,
                message: 'Tipo de contrato eliminado correctamente',
            });
        } catch (error) {
            logger.error('Error deleting contract type', { error });
            res.status(500).json({
                success: false,
                error: 'Error al eliminar tipo de contrato',
            });
        }
    }
}
