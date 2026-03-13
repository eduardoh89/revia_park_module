import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { sequelize } from '../../config/database';
import { Contract } from '../../models/Contract';
import { Company } from '../../models/Company';
import { ContractType } from '../../models/ContractType';
import { ParkingLot } from '../../models/ParkingLot';
import { User } from '../../models/User';
import { ContractRate } from '../../models/ContractRate';
import { ContractRateConfig } from '../../models/ContractRateConfig';
import { Vehicle } from '../../models/Vehicle';
import { ContractVehicle } from '../../models/ContractVehicle';
import { Logger } from '../../shared/utils/logger';


const logger = new Logger('ContractController');

const defaultIncludes = [
    { model: Company },
    { model: ContractType },
    { model: ContractRate },
    { model: ParkingLot },
    { model: User }
];

export class ContractController {
    static async getContractRateConfig(req: Request, res: Response) {
        try {
            const contracts = await Contract.findAll({
                include: [
                    { model: Company },
                    { model: ContractType },
                    { model: ContractRate, include: [{ model: ContractRateConfig }] },
                    { model: ParkingLot },
                    { model: User }
                ],
                order: [['start_date', 'DESC']]
            });

            const arrayIdContracts = contracts.map((c) => c.id_contracts);
            const contractVehicles = await ContractVehicle.findAll({
                where: { id_contracts: arrayIdContracts },
                raw: true,
                nest: true,
                include: [
                    { model: Vehicle }
                ]
            });

            const newContracts = contracts.map((c) => {
                const contractVehicleFound = contractVehicles.find(
                    (v) => v.id_contracts === c.id_contracts
                );

                return {
                    ...c.toJSON(),
                    contractVehicle: contractVehicleFound
                };
            });

            res.json({ success: true, data: newContracts });
        } catch (error) {
            logger.error('Error getting contracts', { error });
            res.status(500).json({ success: false, error: 'Error al obtener contratos' });
        }
    }




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
     * GET /api/v1/contracts/by-license-plate/:plate
     * Busca contratos vigentes asociados a una patente.
     * Lógica:
     *   1. Busca el vehículo por patente (normalizada a mayúsculas).
     *   2. Obtiene los IDs de contratos activos asignados via contract_vehicles.
     *   3. Filtra contratos donde hoy está entre start_date y end_date.
     *   4. Retorna los contratos vigentes o null si no hay.
     */
    static async getByLicensePlate(req: Request, res: Response) {
        try {
            const plate = req.params.plate.trim().toUpperCase();

            // 1. Buscar vehículo por patente
            const vehicle = await Vehicle.findOne({
                where: { license_plate: plate }
            });

            if (!vehicle) {
                return res.json({ success: true, data: null });
            }

            // 2. Obtener IDs de contratos asignados a ese vehículo via contract_vehicles
            const contractVehicles = await ContractVehicle.findAll({
                where: {
                    id_vehicles: vehicle.id_vehicles,
                    is_active: 1
                },
                attributes: ['id_contracts']
            });

            const contractIds = contractVehicles.map(cv => cv.id_contracts);

            if (contractIds.length === 0) {
                return res.json({ success: true, data: null });
            }

            // 3. Filtrar contratos vigentes (hoy entre start_date y end_date)
            const today = new Date().toISOString().split('T')[0];

            const contracts = await Contract.findAll({
                where: {
                    id_contracts: { [Op.in]: contractIds },
                    start_date: { [Op.lte]: today },
                    status: 1,
                    end_date: { [Op.gte]: today }
                },
                include: defaultIncludes
            });

            res.json({
                success: true,
                data: contracts.length > 0 ? contracts : null
            });
        } catch (error) {
            logger.error('Error searching contracts by license plate', { error });
            res.status(500).json({ success: false, error: 'Error al buscar contratos por patente' });
        }
    }

    /**
     * POST /api/v1/contracts
     * Body esperado:
     *   { ...campos del contrato, vehicles: [{ id_vehicles, is_active? }, ...] }
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
                id_parking_lots,
                id_users,
                id_contract_rates,
                vehicles // array de { id_vehicles, is_active? }
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

            const created = await sequelize.transaction(async (t) => {
                // 1. Crear el contrato
                const contract = await Contract.create({
                    start_date,
                    end_date,
                    status: status ?? 1,
                    notes: notes || null,
                    final_price: final_price || null,
                    max_vehicle,
                    id_companies,
                    id_contract_types,
                    id_parking_lots,
                    id_users: id_users || null,
                    id_contract_rates: id_contract_rates || null
                }, { transaction: t });

                // 2. Crear contract_vehicles si se enviaron vehículos
                if (Array.isArray(vehicles) && vehicles.length > 0) {
                    const contractVehiclesData = vehicles.map((v: { id_vehicles: number; is_active?: number }) => ({
                        id_contracts: contract.id_contracts,
                        id_vehicles: v.id_vehicles,
                        is_active: v.is_active ?? 1
                    }));

                    await ContractVehicle.bulkCreate(contractVehiclesData, { transaction: t });
                }

                // 3. Retornar el contrato con sus relaciones
                return Contract.findByPk(contract.id_contracts, {
                    include: [
                        ...defaultIncludes,
                        { model: ContractVehicle, include: [{ model: Vehicle }] }
                    ],
                    transaction: t
                });
            });

            logger.info('Contract created', { id: created?.id_contracts });
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
                id_parking_lots,
                id_users,
                id_contract_rates
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
                ...(id_parking_lots !== undefined && { id_parking_lots }),
                ...(id_users !== undefined && { id_users }),
                ...(id_contract_rates !== undefined && { id_contract_rates })
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
