import { Request, Response } from 'express';
import { Contract } from '../../models/Contract';
import { Company } from '../../models/Company';
import { ContractType } from '../../models/ContractType';
import { ParkingLot } from '../../models/ParkingLot';
import { Logger } from '../../shared/utils/logger';

const logger = new Logger('ContractController');

const defaultIncludes = [
    { model: Company },
    { model: ContractType },
    { model: ParkingLot }
];

export class ContractController {

    /**
     * GET /api/v1/contracts
     */
    static async getAll(req: Request, res: Response) {
        try {
            const { status, id_companies, id_parking_lots, id_contract_types } = req.query;
            const where: any = {};
            if (status !== undefined) where.status = parseInt(status as string);
            if (id_companies) where.id_companies = parseInt(id_companies as string);
            if (id_parking_lots) where.id_parking_lots = parseInt(id_parking_lots as string);
            if (id_contract_types) where.id_contract_types = parseInt(id_contract_types as string);

            const contracts = await Contract.findAll({
                where,
                include: defaultIncludes,
                order: [['start_date', 'DESC']]
            });

            res.json({ success: true, data: contracts });
        } catch (error) {
            logger.error('Error getting contracts', { error });
            res.status(500).json({ success: false, error: 'Error al obtener contratos' });
        }
    }

    /**
     * GET /api/v1/contracts/:id
     */
    static async getById(req: Request, res: Response) {
        try {
            const contract = await Contract.findByPk(parseInt(req.params.id), {
                include: defaultIncludes
            });

            if (!contract) {
                return res.status(404).json({ success: false, error: 'Contrato no encontrado' });
            }

            res.json({ success: true, data: contract });
        } catch (error) {
            logger.error('Error getting contract', { error });
            res.status(500).json({ success: false, error: 'Error al obtener contrato' });
        }
    }

    /**
     * POST /api/v1/contracts
     */
    static async create(req: Request, res: Response) {
        try {
            const {
                start_date,
                end_date,
                status,
                notes,
                final_price,
                max_vehicle,
                id_companies,
                id_contract_types,
                id_parking_lots
            } = req.body;

            if (!start_date || !end_date || !max_vehicle || !id_companies || !id_contract_types || !id_parking_lots) {
                return res.status(400).json({
                    success: false,
                    error: 'start_date, end_date, max_vehicle, id_companies, id_contract_types e id_parking_lots son obligatorios'
                });
            }

            const company = await Company.findByPk(id_companies);
            if (!company) {
                return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
            }

            const contractType = await ContractType.findByPk(id_contract_types);
            if (!contractType) {
                return res.status(404).json({ success: false, error: 'Tipo de contrato no encontrado' });
            }

            const parkingLot = await ParkingLot.findByPk(id_parking_lots);
            if (!parkingLot) {
                return res.status(404).json({ success: false, error: 'Estacionamiento no encontrado' });
            }

            const contract = await Contract.create({
                start_date,
                end_date,
                status: status ?? 1,
                notes: notes || null,
                final_price: final_price || null,
                max_vehicle,
                id_companies,
                id_contract_types,
                id_parking_lots
            });

            const created = await Contract.findByPk(contract.id_contracts, { include: defaultIncludes });

            logger.info('Contract created', { id: contract.id_contracts });
            res.status(201).json({ success: true, data: created });
        } catch (error) {
            logger.error('Error creating contract', { error });
            res.status(500).json({ success: false, error: 'Error al crear contrato' });
        }
    }

    /**
     * PUT /api/v1/contracts/:id
     */
    static async update(req: Request, res: Response) {
        try {
            const contract = await Contract.findByPk(parseInt(req.params.id));
            if (!contract) {
                return res.status(404).json({ success: false, error: 'Contrato no encontrado' });
            }

            const {
                start_date,
                end_date,
                status,
                notes,
                final_price,
                max_vehicle,
                id_companies,
                id_contract_types,
                id_parking_lots
            } = req.body;

            await contract.update({
                ...(start_date !== undefined && { start_date }),
                ...(end_date !== undefined && { end_date }),
                ...(status !== undefined && { status }),
                ...(notes !== undefined && { notes }),
                ...(final_price !== undefined && { final_price }),
                ...(max_vehicle !== undefined && { max_vehicle }),
                ...(id_companies !== undefined && { id_companies }),
                ...(id_contract_types !== undefined && { id_contract_types }),
                ...(id_parking_lots !== undefined && { id_parking_lots })
            });

            const updated = await Contract.findByPk(contract.id_contracts, { include: defaultIncludes });
            res.json({ success: true, data: updated });
        } catch (error) {
            logger.error('Error updating contract', { error });
            res.status(500).json({ success: false, error: 'Error al actualizar contrato' });
        }
    }

    /**
     * DELETE /api/v1/contracts/:id
     */
    static async delete(req: Request, res: Response) {
        try {
            const contract = await Contract.findByPk(parseInt(req.params.id));
            if (!contract) {
                return res.status(404).json({ success: false, error: 'Contrato no encontrado' });
            }

            if (contract.status === 1) {
                return res.status(409).json({ success: false, error: 'No se puede eliminar un contrato activo' });
            }

            await contract.destroy();
            res.json({ success: true, message: 'Contrato eliminado correctamente' });
        } catch (error) {
            logger.error('Error deleting contract', { error });
            res.status(500).json({ success: false, error: 'Error al eliminar contrato' });
        }
    }
}
