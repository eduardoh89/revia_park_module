import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { ParkingSession } from '../../models/ParkingSession';
import { Vehicle } from '../../models/Vehicle';
import { VehicleType } from '../../models/VehicleType';
import { VehicleRate } from '../../models/VehicleRate';
import { VehicleRateConfig } from '../../models/VehicleRateConfig';
import { ParkingLot } from '../../models/ParkingLot';
import { Contract } from '../../models/Contract';
import { UnidentifiedVehicle } from '../../models/UnidentifiedVehicle';
import { Logger } from '../../shared/utils/logger';
import { Exception } from '../../models/Exception';
import { ContractVehicle } from '../../models/ContractVehicle';

const logger = new Logger('ParkingSessionController');

export class ParkingSessionController {

    /**
     * GET /api/v1/parking-sessions
     * Listar todas las sesiones de estacionamiento
     */
    static async postFilteredParkingSessions(req: Request, res: Response) {
        try {
            const { status, id_parking_lots, id_vehicles, is_positive } = req.body;

            const where: any = {};
            if (status) where.status = status;
            if (id_parking_lots) where.id_parking_lots = parseInt(id_parking_lots as string);
            if (id_vehicles) where.id_vehicles = parseInt(id_vehicles as string);
            if (is_positive) where.status = { [Op.ne]: 'FALSE_POSITIVE' };


            const sessions = await ParkingSession.findAll({
                where,
                include: [
                    {
                        model: Vehicle, as: 'vehicle',
                        include: [{
                            model: VehicleType,
                            include: [{
                                model: VehicleRate,
                                include: [{ model: VehicleRateConfig }]
                            }]
                        }]
                    },
                    { model: ParkingLot },
                    { model: Contract, required: false },
                    { model: UnidentifiedVehicle, required: false }
                ],
                order: [['arrival_time', 'DESC']]
            });

            res.json({
                success: true,
                data: sessions
            });
        } catch (error) {
            logger.error('Error getting parking sessions', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener sesiones de estacionamiento'
            });
        }
    }



    static async postExceptionSessions(req: Request, res: Response) {
        try {

            const exceptions = await Exception.findAll({
                where: { id_exception_types: 3 }, // ingreso manual
                raw: true,
                nest: true,
            });
            const allowedIds = exceptions.map(p => p.id_parking_sessions);
            const sessions = await ParkingSession.findAll({
                where: { id_parking_sessions: { [Op.in]: allowedIds } },
                include: [
                    {
                        model: Vehicle, as: 'vehicle',
                        include: [{
                            model: VehicleType,
                        }]
                    },
                ],
                order: [['arrival_time', 'DESC']],
                raw: true,
                nest: true,

            });

            const keyExceptions = exceptions.reduce((acc: Record<number, string>, el: any) => {
                acc[el.id_parking_sessions] = el.notes;
                return acc;
            }, {});

            const finalSessions = sessions.map((x) => ({
                ...x,
                notes: keyExceptions[x.id_parking_sessions]
            }));

            res.json({
                success: true,
                data: finalSessions
            });
        } catch (error) {
            logger.error('Error getting parking sessions', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener sesiones de estacionamiento'
            });
        }
    }

    /**
     * GET /api/v1/parking-sessions/:id
     * Obtener una sesión por ID
     */
    static async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const parsedId = parseInt(id);

            if (isNaN(parsedId)) {
                return res.status(400).json({
                    success: false,
                    error: 'El id debe ser un número válido'
                });
            }

            const session = await ParkingSession.findByPk(parsedId, {
                include: [
                    { model: Vehicle, as: 'vehicle' },
                    { model: Vehicle, as: 'trailer', required: false },
                    { model: ParkingLot },
                    { model: Contract, required: false },
                    { model: UnidentifiedVehicle, required: false }
                ]
            });

            if (!session) {
                return res.status(404).json({
                    success: false,
                    error: 'Sesión de estacionamiento no encontrada'
                });
            }

            res.json({
                success: true,
                data: session
            });
        } catch (error) {
            logger.error('Error getting parking session', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener sesión de estacionamiento'
            });
        }
    }

    /**
     * POST /api/v1/parking-sessions
     * Crear una nueva sesión de estacionamiento
     */
    static async create(req: Request, res: Response) {
        try {
            const {
                arrival_time,
                id_parking_lots,
                id_vehicles,
                id_trailer,
                id_contracts,
                id_unidentified_vehicles,
                status,
                has_trailer_entry,
                has_trailer_exit
            } = req.body;

            if (!id_parking_lots) {
                return res.status(400).json({
                    success: false,
                    error: 'El estacionamiento es obligatorio'
                });
            }

            if (!id_vehicles) {
                return res.status(400).json({
                    success: false,
                    error: 'El vehículo es obligatorio'
                });
            }

            const parkingLot = await ParkingLot.findByPk(id_parking_lots);
            if (!parkingLot) {
                return res.status(404).json({
                    success: false,
                    error: 'Estacionamiento no encontrado'
                });
            }

            const vehicle = await Vehicle.findByPk(id_vehicles);
            if (!vehicle) {
                return res.status(404).json({
                    success: false,
                    error: 'Vehículo no encontrado'
                });
            }

            const activeSession = await ParkingSession.findOne({
                where: {
                    id_vehicles,
                    status: 'PARKED'
                }
            });

            if (activeSession) {
                return res.status(409).json({
                    success: false,
                    error: 'El vehículo ya tiene una sesión activa en curso'
                });
            }

            const session = await ParkingSession.create({
                arrival_time: arrival_time ? new Date(arrival_time) : new Date(),
                status: status || 'PARKED',
                has_trailer_entry: has_trailer_entry ?? 0,
                has_trailer_exit: has_trailer_exit ?? 0,
                id_parking_lots,
                id_vehicles,
                id_trailer: id_trailer || null,
                id_contracts: id_contracts || null,
                id_unidentified_vehicles: id_unidentified_vehicles || null
            });

            const created = await ParkingSession.findByPk(session.id_parking_sessions, {
                include: [
                    { model: Vehicle, as: 'vehicle' },
                    { model: ParkingLot },
                    { model: Contract, required: false },
                    { model: UnidentifiedVehicle, required: false }
                ]
            });

            logger.info('Parking session created', { sessionId: session.id_parking_sessions });

            res.status(201).json({
                success: true,
                data: created
            });
        } catch (error) {
            logger.error('Error creating parking session', { error });
            res.status(500).json({
                success: false,
                error: 'Error al crear sesión de estacionamiento'
            });
        }
    }

    /**
     * PUT /api/v1/parking-sessions/:id
     * Actualizar una sesión de estacionamiento
     */
    static async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const {
                arrival_time,
                exit_time,
                pay_time,
                status,
                has_trailer_entry,
                has_trailer_exit,
                id_trailer,
                id_contracts,
                id_unidentified_vehicles
            } = req.body;

            const session = await ParkingSession.findByPk(parseInt(id));

            if (!session) {
                return res.status(404).json({
                    success: false,
                    error: 'Sesión de estacionamiento no encontrada'
                });
            }

            await session.update({
                ...(arrival_time !== undefined && { arrival_time: new Date(arrival_time) }),
                ...(exit_time !== undefined && { exit_time: new Date(exit_time) }),
                ...(pay_time !== undefined && { pay_time: new Date(pay_time) }),
                ...(status !== undefined && { status }),
                ...(has_trailer_entry !== undefined && { has_trailer_entry }),
                ...(has_trailer_exit !== undefined && { has_trailer_exit }),
                ...(id_trailer !== undefined && { id_trailer }),
                ...(id_contracts !== undefined && { id_contracts }),
                ...(id_unidentified_vehicles !== undefined && { id_unidentified_vehicles })
            });

            const updated = await ParkingSession.findByPk(session.id_parking_sessions, {
                include: [
                    { model: Vehicle, as: 'vehicle' },
                    { model: Vehicle, as: 'trailer', required: false },
                    { model: ParkingLot },
                    { model: Contract, required: false },
                    { model: UnidentifiedVehicle, required: false }
                ]
            });

            res.json({
                success: true,
                data: updated
            });
        } catch (error) {
            logger.error('Error updating parking session', { error });
            res.status(500).json({
                success: false,
                error: 'Error al actualizar sesión de estacionamiento'
            });
        }
    }

    /**
     * DELETE /api/v1/parking-sessions/:id
     * Eliminar una sesión de estacionamiento
     */
    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const session = await ParkingSession.findByPk(parseInt(id));

            if (!session) {
                return res.status(404).json({
                    success: false,
                    error: 'Sesión de estacionamiento no encontrada'
                });
            }

            if (session.status === 'PARKED') {
                return res.status(409).json({
                    success: false,
                    error: 'No se puede eliminar una sesión activa (PARKED)'
                });
            }

            await session.destroy();

            res.json({
                success: true,
                message: 'Sesión de estacionamiento eliminada correctamente'
            });
        } catch (error) {
            logger.error('Error deleting parking session', { error });
            res.status(500).json({
                success: false,
                error: 'Error al eliminar sesión de estacionamiento'
            });
        }
    }

    /**
     * GET /api/v1/parking-sessions/active
     * Listar sesiones activas (status = PARKED)
     */
    static async getActive(req: Request, res: Response) {
        try {
            const { id_parking_lots } = req.query;

            const where: any = { status: 'PARKED' };
            if (id_parking_lots) where.id_parking_lots = parseInt(id_parking_lots as string);

            const sessions = await ParkingSession.findAll({
                where,
                include: [
                    { model: Vehicle, as: 'vehicle' },
                    { model: ParkingLot },
                    { model: Contract, required: false },
                    { model: UnidentifiedVehicle, required: false }
                ],
                order: [['arrival_time', 'ASC']]
            });

            res.json({
                success: true,
                data: sessions,
                count: sessions.length
            });
        } catch (error) {
            logger.error('Error getting active parking sessions', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener sesiones activas'
            });
        }
    }

    /**
     * POST /api/v1/parking-sessions/by-date
     * Obtener sesiones por fecha (arrival_time), solo ParkingSession + Vehicle
     */
    static async getByDate(req: Request, res: Response) {
        try {
            const { date } = req.body;

            if (!date) {
                return res.status(400).json({
                    success: false,
                    error: 'El campo date es obligatorio (formato: YYYY-MM-DD)'
                });
            }

            const start = new Date(`${date}T00:00:00.000Z`);
            const end = new Date(`${date}T23:59:59.999Z`);

            if (isNaN(start.getTime())) {
                return res.status(400).json({
                    success: false,
                    error: 'Formato de fecha inválido. Use YYYY-MM-DD'
                });
            }

            const sessions = await ParkingSession.findAll({
                where: {
                    arrival_time: { [Op.between]: [start, end] }
                },
                include: [
                    { model: Vehicle, as: 'vehicle' }
                ],
                order: [['arrival_time', 'ASC']]
            });

            res.json({
                success: true,
                data: sessions,
                count: sessions.length
            });
        } catch (error) {
            logger.error('Error getting parking sessions by date', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener sesiones por fecha'
            });
        }
    }

    /**
     * PATCH /api/v1/parking-sessions/:id/exit
     * Registrar salida de una sesión
     */
    static async registerExit(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status, has_trailer_exit } = req.body;

            const session = await ParkingSession.findByPk(parseInt(id));

            if (!session) {
                return res.status(404).json({
                    success: false,
                    error: 'Sesión de estacionamiento no encontrada'
                });
            }

            if (session.status !== 'PARKED') {
                return res.status(409).json({
                    success: false,
                    error: 'La sesión no está en estado PARKED'
                });
            }

            const exitStatus = status || 'EXITED_PAID';
            const validStatuses = ['EXITED_PAID', 'EXITED_CONTRACT', 'EXITED_EXCEPTION'];
            if (!validStatuses.includes(exitStatus)) {
                return res.status(400).json({
                    success: false,
                    error: `Estado de salida inválido. Valores permitidos: ${validStatuses.join(', ')}`
                });
            }

            await session.update({
                exit_time: new Date(),
                status: exitStatus,
                ...(has_trailer_exit !== undefined && { has_trailer_exit })
            });

            const updated = await ParkingSession.findByPk(session.id_parking_sessions, {
                include: [
                    { model: Vehicle, as: 'vehicle' },
                    { model: ParkingLot }
                ]
            });

            logger.info('Exit registered', { sessionId: session.id_parking_sessions, status: exitStatus });

            res.json({
                success: true,
                message: 'Salida registrada correctamente',
                data: updated
            });
        } catch (error) {
            logger.error('Error registering exit', { error });
            res.status(500).json({
                success: false,
                error: 'Error al registrar salida'
            });
        }
    }


    /**
 * POST /api/v1/parking-sessions
 * Crear una nueva sesión de estacionamiento
 */
    static async createWithException(req: Request, res: Response) {
        try {
            const {
                arrival_time,
                id_parking_lots,
                id_vehicles,
                id_trailer,
                id_contracts,
                id_unidentified_vehicles,
                status,
                has_trailer_entry,
                has_trailer_exit,
                notes
            } = req.body;

            let contractId = null;

            if (!id_parking_lots) {
                return res.status(400).json({
                    success: false,
                    error: 'El estacionamiento es obligatorio'
                });
            }

            if (!id_vehicles) {
                return res.status(400).json({
                    success: false,
                    error: 'El vehículo es obligatorio'
                });
            }

            const parkingLot = await ParkingLot.findByPk(id_parking_lots);
            if (!parkingLot) {
                return res.status(404).json({
                    success: false,
                    error: 'Estacionamiento no encontrado'
                });
            }

            const vehicle = await Vehicle.findByPk(id_vehicles);
            if (!vehicle) {
                return res.status(404).json({
                    success: false,
                    error: 'Vehículo no encontrado'
                });
            }

            const activeSession = await ParkingSession.findOne({
                where: {
                    id_vehicles,
                    status: 'PARKED'
                }
            });

            if (activeSession) {
                return res.status(409).json({
                    success: false,
                    error: 'El vehículo ya tiene una sesión activa en curso'
                });
            }
            /// Tengo que buscar si tiene contrato(plan) o no 
            const contractVehicles = await ContractVehicle.findOne({
                where: {
                    id_vehicles: id_vehicles,
                    is_active: 1
                },
                attributes: ['id_contracts']
            });
            contractId = contractVehicles ? contractVehicles!.dataValues.id_contracts : null;
            const today = new Date().toISOString().split('T')[0];
            const contracts = await Contract.findOne({
                where: {
                    id_contracts: contractId,
                    start_date: { [Op.lte]: today },
                    status: 1, // estado Validado
                    end_date: { [Op.gte]: today }
                },
            });

            if (!contracts) { // si el contracto si existe pero no esta habilitado
                contractId = null;
            }

            const session = await ParkingSession.create({
                arrival_time: arrival_time ? new Date(arrival_time) : new Date(),
                status: status || 'PARKED',
                id_parking_lots,
                id_vehicles,
                id_contracts: contractId,
            });


            const idExceptionTypes = 3;//Ingreso manual

            await Exception.create({
                created_by: 'SYSTEM',
                status: 'RESOLVED',
                occurred_at: new Date(),
                id_exception_types: idExceptionTypes,
                id_parking_lots: id_parking_lots,
                id_parking_sessions: session.id_parking_sessions,
                notes: notes,
            });


            const created = await ParkingSession.findByPk(session.id_parking_sessions, {
                include: [
                    { model: Vehicle, as: 'vehicle' },
                    { model: ParkingLot },
                ]
            });

            logger.info('Parking session created', { sessionId: session.id_parking_sessions });

            res.status(201).json({
                success: true,
                data: created
            });
        } catch (error) {
            logger.error('Error creating parking session', { error });
            res.status(500).json({
                success: false,
                error: 'Error al crear sesión de estacionamiento'
            });
        }
    }

    static async updateWithException(req: Request, res: Response) {
        try {

            const { id } = req.params;
            const {
                arrival_time,
                id_parking_lots,
                id_vehicles,
                id_trailer,
                id_contracts,
                id_unidentified_vehicles,
                status,
                has_trailer_entry,
                has_trailer_exit,
                notes
            } = req.body;

            let contractId = null;


            const sessionNow = await ParkingSession.findByPk(parseInt(id));


            if (!sessionNow) {
                return res.status(404).json({
                    success: false,
                    error: 'Sesión de estacionamiento no encontrada'
                });
            }

            const idVehiclesOriginal = sessionNow.dataValues.id_vehicles;


            if (!id_parking_lots) {
                return res.status(400).json({
                    success: false,
                    error: 'El estacionamiento es obligatorio'
                });
            }

            if (!id_vehicles) {
                return res.status(400).json({
                    success: false,
                    error: 'El vehículo es obligatorio'
                });
            }

            const parkingLot = await ParkingLot.findByPk(id_parking_lots);
            if (!parkingLot) {
                return res.status(404).json({
                    success: false,
                    error: 'Estacionamiento no encontrado'
                });
            }

            const vehicle = await Vehicle.findByPk(id_vehicles);
            if (!vehicle) {
                return res.status(404).json({
                    success: false,
                    error: 'Vehículo no encontrado'
                });
            }

            /// aqui validad porque puede 

            if (idVehiclesOriginal != id_vehicles) {
                const activeSession = await ParkingSession.findOne({
                    where: {
                        id_vehicles,
                        status: 'PARKED' // puede ser que necesito otros diferentes "status"
                    }
                });

                if (activeSession) {
                    return res.status(409).json({
                        success: false,
                        error: 'El vehículo ya tiene una sesión activa en curso'
                    });
                }
            }




            /// Tengo que buscar si tiene contrato(plan) o no 
            const contractVehicles = await ContractVehicle.findOne({
                where: {
                    id_vehicles: id_vehicles,
                    is_active: 1
                },
                attributes: ['id_contracts']
            });
            contractId = contractVehicles ? contractVehicles!.dataValues.id_contracts : null;
            const today = new Date().toISOString().split('T')[0];
            const contracts = await Contract.findOne({
                where: {
                    id_contracts: contractId,
                    start_date: { [Op.lte]: today },
                    status: 1, // estado Validado
                    end_date: { [Op.gte]: today }
                },
            });

            if (!contracts) { // si el contracto si existe pero no esta habilitado
                contractId = null;
            }


            await sessionNow.update({
                arrival_time: arrival_time,
                status: status,
                id_parking_lots,
                id_vehicles,
                id_contracts: contractId,
            });

            const exception = await Exception.findOne({
                where: { id_parking_sessions: id }
            });

            if (exception) {
                await exception.update({
                    notes: notes,
                });
            }


            const updated = await ParkingSession.findByPk(id, {
                include: [
                    { model: Vehicle, as: 'vehicle' },
                    { model: ParkingLot },
                ]
            });

            logger.info('Parking session created', { sessionId: id });

            res.status(200).json({
                success: true,
                data: updated
            });
        } catch (error) {
            logger.error('Error creating parking session', { error });
            res.status(500).json({
                success: false,
                error: 'Error al crear sesión de estacionamiento'
            });
        }
    }


    static async getIsParked(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const sessions = await ParkingSession.findOne({
                where: {
                    status: 'PARKED',
                    id_vehicles: id
                },
            });
            if (!sessions) {
               return res.status(204).json({
                    success: false,
                    error: 'No esta estacionado'
                });
            }
            res.json({
                success: true,
                data: sessions,

            });
        } catch (error) {
            logger.error('Error getting active parking sessiondds', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener sesiones activas'
            });
        }
    }




}
