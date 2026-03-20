import { Request, Response } from 'express';
import { ContractVehicle } from '../../models/ContractVehicle';
import { Contract } from '../../models/Contract';
import { Vehicle } from '../../models/Vehicle';
import { Logger } from '../../shared/utils/logger';

const logger = new Logger('ContractVehicleController');

export class ContractVehicleController {

    /**
     * GET /api/v1/contract-vehicles
     */
    static async getAll(req: Request, res: Response) {
        try {
            const items = await ContractVehicle.findAll({
                include: [{ model: Contract }, { model: Vehicle }]
            });
            res.json({ success: true, data: items });
        } catch (error) {
            logger.error('Error getting contract vehicles', { error });
            res.status(500).json({ success: false, error: 'Error al obtener vehículos del contrato' });
        }
    }

    /**
     * GET /api/v1/contract-vehicles/:id
     */
    static async getById(req: Request, res: Response) {
        try {
            const item = await ContractVehicle.findByPk(parseInt(req.params.id), {
                include: [{ model: Contract }, { model: Vehicle }]
            });

            if (!item) {
                return res.status(404).json({ success: false, error: 'Registro no encontrado' });
            }

            res.json({ success: true, data: item });
        } catch (error) {
            logger.error('Error getting contract vehicle', { error });
            res.status(500).json({ success: false, error: 'Error al obtener vehículo del contrato' });
        }
    }

    /**
     * GET /api/v1/contract-vehicles/by-contract/:contractId
     */
    static async getByContract(req: Request, res: Response) {
        try {
            const items = await ContractVehicle.findAll({
                where: { id_contracts: parseInt(req.params.contractId) },
                include: [{ model: Vehicle }]
            });
            res.json({ success: true, data: items });
        } catch (error) {
            logger.error('Error getting vehicles by contract', { error });
            res.status(500).json({ success: false, error: 'Error al obtener vehículos del contrato' });
        }
    }

    /**
     * POST /api/v1/contract-vehicles
     */
    static async create(req: Request, res: Response) {
        try {
            const { id_vehicles, id_contracts, is_active } = req.body;

            if (!id_vehicles || !id_contracts) {
                return res.status(400).json({ success: false, error: 'id_vehicles e id_contracts son obligatorios' });
            }

            const item = await ContractVehicle.create({
                id_vehicles,
                id_contracts,
                is_active: is_active ?? 1
            });

            const created = await ContractVehicle.findByPk(item.id_contract_vehicles, {
                include: [{ model: Contract }, { model: Vehicle }]
            });

            res.status(201).json({ success: true, data: created });
        } catch (error) {
            logger.error('Error creating contract vehicle', { error });
            res.status(500).json({ success: false, error: 'Error al crear vehículo del contrato' });
        }
    }

    /**
     * PUT /api/v1/contract-vehicles/:id
     */
    static async update(req: Request, res: Response) {
        try {
            const item = await ContractVehicle.findByPk(parseInt(req.params.id));

            if (!item) {
                return res.status(404).json({ success: false, error: 'Registro no encontrado' });
            }

            const { id_vehicles, id_contracts, is_active } = req.body;

            await item.update({
                ...(id_vehicles !== undefined && { id_vehicles }),
                ...(id_contracts !== undefined && { id_contracts }),
                ...(is_active !== undefined && { is_active })
            });

            const updated = await ContractVehicle.findByPk(item.id_contract_vehicles, {
                include: [{ model: Contract }, { model: Vehicle }]
            });

            res.json({ success: true, data: updated });
        } catch (error) {
            logger.error('Error updating contract vehicle', { error });
            res.status(500).json({ success: false, error: 'Error al actualizar vehículo del contrato' });
        }
    }

    /**
     * DELETE /api/v1/contract-vehicles/:id
     */
    static async delete(req: Request, res: Response) {
        try {
            const item = await ContractVehicle.findByPk(parseInt(req.params.id));

            if (!item) {
                return res.status(404).json({ success: false, error: 'Registro no encontrado' });
            }

            await item.destroy();
            res.json({ success: true, message: 'Vehículo del contrato eliminado correctamente' });
        } catch (error) {
            logger.error('Error deleting contract vehicle', { error });
            res.status(500).json({ success: false, error: 'Error al eliminar vehículo del contrato' });
        }
    }
}
