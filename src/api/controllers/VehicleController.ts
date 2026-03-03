import { Request, Response } from 'express';
import { Vehicle } from '../../models/Vehicle';
import { VehicleType } from '../../models/VehicleType';
import { ParkingSession, SessionStatus } from '../../models/ParkingSession';
import { ParkingLot } from '../../models/ParkingLot';
import { Logger } from '../../shared/utils/logger';
import { PaymentLinkService } from '../../whatsapp/services/PaymentLinkService';
import { UnidentifiedVehicle } from '../../models/UnidentifiedVehicle';
import { Exception } from '../../models/Exception';

const logger = new Logger('VehicleController');

export class VehicleController {

    /**
     * GET /api/v1/vehicles
     * Listar todos los vehículos
     */
    static async getAll(req: Request, res: Response) {
        try {
            const vehicles = await Vehicle.findAll({
                include: [{ model: VehicleType }],
            });

            res.json({
                success: true,
                data: vehicles
            });
        } catch (error) {
            logger.error('Error getting vehicles', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener vehículos',
            });
        }
    }



    /**
     * GET /api/v1/vehicles/:id
     * Obtener un vehículo por ID
     */
    static async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const vehicle = await Vehicle.findByPk(parseInt(id), {
                include: [{ model: VehicleType }],
            });

            if (!vehicle) {
                return res.status(404).json({
                    success: false,
                    error: 'Vehículo no encontrado',
                });
            }

            res.json({
                success: true,
                data: vehicle,
            });
        } catch (error) {
            logger.error('Error getting vehicle', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener vehículo',
            });
        }
    }

    /**
     * POST /api/v1/vehicles
     * Crear un nuevo vehículo
     */
    static async create(req: Request, res: Response) {
        try {
            const { license_plate, id_vehicle_types, url_foto } = req.body;


            if (!license_plate) {
                return res.status(400).json({
                    success: false,
                    error: 'La patente es obligatoria',
                });
            }

            if (!id_vehicle_types) {
                return res.status(400).json({
                    success: false,
                    error: 'El tipo de vehículo es obligatorio',
                });
            }

            const existingVehicle = await Vehicle.findOne({ where: { license_plate: license_plate } });
            if (existingVehicle) {
                return res.status(409).json({
                    success: false,
                    error: 'Ya existe un vehículo con esa patente',
                });
            }

            const vehicleType = await VehicleType.findByPk(id_vehicle_types);
            if (!vehicleType) {
                return res.status(404).json({
                    success: false,
                    error: 'Tipo de vehículo no encontrado',
                });
            }

            const vehicle = await Vehicle.create({
                license_plate: license_plate,
                id_vehicle_types: id_vehicle_types,
                url_foto: url_foto || null
            });

            res.status(201).json({
                success: true,
                data: {
                    id: vehicle.id_vehicles,
                    licensePlate: vehicle.license_plate,
                    vehicleType: { id: vehicleType.id_vehicle_types, name: vehicleType.name },
                    createdAt: vehicle.created_at,
                },
            });
        } catch (error) {
            logger.error('Error creating vehicle', { error });
            res.status(500).json({
                success: false,
                error: 'Error al crear vehículo',
            });
        }
    }

    /**
     * PUT /api/v1/vehicles/:id
     * Actualizar un vehículo
     */
    static async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { licensePlate, vehicleTypeId, url_foto } = req.body;

            const vehicle = await Vehicle.findByPk(parseInt(id));

            if (!vehicle) {
                return res.status(404).json({
                    success: false,
                    error: 'Vehículo no encontrado',
                });
            }

            if (licensePlate) {
                const existingVehicle = await Vehicle.findOne({
                    where: { license_plate: licensePlate },
                });
                if (existingVehicle && existingVehicle.id_vehicles !== vehicle.id_vehicles) {
                    return res.status(409).json({
                        success: false,
                        error: 'Ya existe otro vehículo con esa patente',
                    });
                }
            }

            if (vehicleTypeId) {
                const vehicleType = await VehicleType.findByPk(vehicleTypeId);
                if (!vehicleType) {
                    return res.status(404).json({
                        success: false,
                        error: 'Tipo de vehículo no encontrado',
                    });
                }
            }

            await vehicle.update({
                ...(licensePlate && { license_plate: licensePlate }),
                ...(vehicleTypeId && { id_vehicle_types: vehicleTypeId }),
                ...(url_foto !== undefined && { url_foto })
            });

            const updatedVehicle = await Vehicle.findByPk(vehicle.id_vehicles, {
                include: [{ model: VehicleType }],
            });

            res.json({
                success: true,
                data: {
                    id: updatedVehicle!.id_vehicles,
                    licensePlate: updatedVehicle!.license_plate,
                    vehicleType: updatedVehicle!.vehicleType
                        ? { id: updatedVehicle!.vehicleType.id_vehicle_types, name: updatedVehicle!.vehicleType.name }
                        : null,
                    createdAt: updatedVehicle!.created_at,
                },
            });
        } catch (error) {
            logger.error('Error updating vehicle', { error });
            res.status(500).json({
                success: false,
                error: 'Error al actualizar vehículo',
            });
        }
    }

    /**
     * DELETE /api/v1/vehicles/:id
     * Eliminar un vehículo
     */
    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const vehicle = await Vehicle.findByPk(parseInt(id));

            if (!vehicle) {
                return res.status(404).json({
                    success: false,
                    error: 'Vehículo no encontrado',
                });
            }

            const activeSession = await ParkingSession.findOne({
                where: {
                    id_vehicles: vehicle.id_vehicles,
                    status: 'PARKED',
                },
            });

            if (activeSession) {
                return res.status(409).json({
                    success: false,
                    error: 'No se puede eliminar un vehículo con sesión activa',
                });
            }

            await vehicle.destroy();

            res.json({
                success: true,
                message: 'Vehículo eliminado correctamente',
            });
        } catch (error) {
            logger.error('Error deleting vehicle', { error });
            res.status(500).json({
                success: false,
                error: 'Error al eliminar vehículo',
            });
        }
    }

    /**
     * Calcular el monto a pagar usando VehicleRate/VehicleRateConfig
     */
    static async calculateAmount(sessionId: number): Promise<number> {
        const service = new PaymentLinkService();
        return service.calculateAmount(sessionId);
    }

    /**
     * POST /api/v1/vehicles/movement
     * Endpoint unificado para registrar entrada o salida de vehículo.
     *
     * Campo requerido en el body:
     *   movement_type: "ENTRY" | "EXIT"
     *
     * Para ENTRY también enviar: licensePlate, vehicleType, parkingLotId?, arrival_time?
     * Para EXIT  también enviar: licensePlate o temp_reference, status?, has_trailer_exit?
     */
    static async registerMovement(req: Request, res: Response) {
        const { movement_type } = req.body;

        if (!movement_type) {
            return res.status(400).json({
                success: false,
                error: 'El campo movement_type es obligatorio. Valores permitidos: ENTRY, EXIT'
            });
        }

        const type = String(movement_type).toUpperCase();

        if (type === 'ENTRY') {
            return VehicleController.registerEntry(req, res);
        }

        if (type === 'EXIT') {
            return VehicleController.registerExit(req, res);
        }

        return res.status(400).json({
            success: false,
            error: `movement_type inválido: "${movement_type}". Valores permitidos: ENTRY, EXIT`
        });
    }

    /**
     * POST /api/v1/vehicles/entry
     * Registrar entrada de vehículo al estacionamiento
     */
    static async registerEntry(req: Request, res: Response) {
        try {
            const {
                licensePlate,
                parkingLotId = 1,
                arrival_time,
                vehicleType
            } = req.body;


            const vehicleTypes: Record<string, number> = {
                AUTO: 1,
                BUS: 3,
                CAMION: 3
            };

            const vehicleTypeId = vehicleTypes[vehicleType];

            if (!vehicleTypeId) {
                return res.status(400).json({
                    success: false,
                    error: `Tipo de vehículo inválido. Valores permitidos: ${Object.keys(vehicleTypes).join(', ')}`
                });
            }


            let idUnidentifiedVehicles = null;
            let idVehicles = null;

            if (!licensePlate) {
                const generatedRef = `TPE-${Date.now().toString(36)}`.toUpperCase();
                const record = await UnidentifiedVehicle.create({
                    temp_reference: generatedRef,
                    capture_image_url: null,
                    notes: null,
                    movement_type: 'ENTRY',
                    created_at: new Date(),
                    id_vehicles: null
                });

                idUnidentifiedVehicles = record.id_unidentified_vehicles;
                logger.info('Unidentified vehicle created', { idUnidentifiedVehicles });

                const idExceptionTypes = 1;//Patente no legible

                await Exception.create({
                    created_by: 'SYSTEM',
                    status: 'OPEN',
                    occurred_at: new Date(),
                    id_exception_types: idExceptionTypes,
                    id_parking_lots: 1,
                    id_unidentified_vehicles: idUnidentifiedVehicles,
                    notes: 'Vehículo ingresado sin patente legible',
                });


                const session = await ParkingSession.create({
                    arrival_time: arrival_time ? new Date(arrival_time) : new Date(),
                    status: 'PARKED',
                    has_trailer_entry: 0,
                    has_trailer_exit: 0,
                    id_parking_lots: parkingLotId,
                    id_unidentified_vehicles: idUnidentifiedVehicles,
                    //id_contracts: id_contracts || null,
                });

                return res.status(201).json({
                    success: true,
                    message: 'Entrada registrada correctamente',
                    data: {
                        sessionId: session.id_parking_sessions,
                        licensePlate: licensePlate,
                        arrivalTime: session.arrival_time,
                    },
                });


            } else {

                const vehicleOne = await Vehicle.findOne({
                    where: { license_plate: licensePlate }
                });

  
                

                if (!vehicleOne) {
                    const vehicle = await Vehicle.create({
                        license_plate: licensePlate.trim().toUpperCase(),
                        id_vehicle_types: vehicleTypeId,
                    });
                    idVehicles = vehicle.id_vehicles;
                    logger.info('Vehicle created', { idVehicles });
                } else {
                    idVehicles = vehicleOne.id_vehicles;
                }

                

                const activeSession = await ParkingSession.findOne({
                    include: [{
                            model: Vehicle, as: 'vehicle',
                    }],
                    where: { status: 'PARKED', id_vehicles: idVehicles }
                });



                if (activeSession) {

                    await Exception.create({
                        created_by: 'SYSTEM',
                        status: 'OPEN',
                        occurred_at: new Date(),
                        id_parking_sessions: activeSession.id_parking_sessions,
                        id_parking_lots: 1,
                        id_exception_types: 9, //VEHICLE_ALREADY_PARKED
                        notes: 'El vehículo ya tiene una sesión activa',
                    });


                    return res.status(409).json({
                        success: false,
                        error: 'El vehículo ya tiene una sesión activa',
                        session: {
                            id: activeSession.id_parking_sessions,
                            arrivalTime: activeSession.arrival_time,
                        },
                    });
                } else {



                    const session = await ParkingSession.create({
                        arrival_time: arrival_time ? new Date(arrival_time) : new Date(),
                        status: 'PARKED',
                        has_trailer_entry: 0,
                        has_trailer_exit: 0,
                        id_parking_lots: parkingLotId,
                        id_vehicles: idVehicles,
                        id_trailer: null,
                        //id_contracts: id_contracts || null,
                    });

                    res.status(201).json({
                        success: true,
                        message: 'Entrada registrada correctamente',
                        data: {
                            sessionId: session.id_parking_sessions,
                            licensePlate: licensePlate,
                            arrivalTime: session.arrival_time,
                        },
                    });

                }
            }
        } catch (error) {
            logger.error('Error registering vehicle entry', { error });
            res.status(500).json({
                success: false,
                error: 'Error al registrar entrada',
            });
        }
    }

    /**
     * POST /api/v1/vehicles/exit
     * Registrar salida de vehículo del estacionamiento
     */
    static async registerExit(req: Request, res: Response) {
        try {
            const {
                licensePlate,
                temp_reference,
                status,
                has_trailer_exit
            } = req.body;

            // Validar que se envió al menos un identificador
            if (!licensePlate && !temp_reference) {
                return res.status(400).json({
                    success: false,
                    error: 'Debe proporcionar licensePlate o temp_reference'
                });
            }

            // Validar status de salida
            const validExitStatuses: SessionStatus[] = ['EXITED_PAID', 'EXITED_CONTRACT', 'EXITED_EXCEPTION'];
            const exitStatus: SessionStatus = status || 'EXITED_PAID';

            if (!validExitStatuses.includes(exitStatus)) {
                return res.status(400).json({
                    success: false,
                    error: `Estado inválido. Valores permitidos: ${validExitStatuses.join(', ')}`
                });
            }

            let session: ParkingSession | null = null;

            // --- Caso 1: Vehículo NO identificado (temp_reference) ---
            if (!licensePlate && temp_reference) {
                const unidentified = await UnidentifiedVehicle.findOne({
                    where: { temp_reference }
                });

                if (!unidentified) {
                    return res.status(404).json({
                        success: false,
                        error: 'Vehículo no identificado no encontrado'
                    });
                }

                session = await ParkingSession.findOne({
                    where: {
                        id_unidentified_vehicles: unidentified.id_unidentified_vehicles,
                        status: 'PARKED'
                    }
                });

                if (!session) {
                    return res.status(404).json({
                        success: false,
                        error: 'No se encontró sesión activa para este vehículo no identificado'
                    });
                }

            // --- Caso 2: Vehículo identificado (licensePlate) ---
            } else {
                const vehicle = await Vehicle.findOne({
                    where: { license_plate: licensePlate.trim().toUpperCase() }
                });

                if (!vehicle) {
                    return res.status(404).json({
                        success: false,
                        error: 'Vehículo no encontrado'
                    });
                }

                session = await ParkingSession.findOne({
                    where: {
                        id_vehicles: vehicle.id_vehicles,
                        status: 'PARKED'
                    }
                });

                if (!session) {
                    return res.status(404).json({
                        success: false,
                        error: 'No se encontró sesión activa para este vehículo'
                    });
                }
            }

            // Actualizar sesión con la salida
            await session.update({
                exit_time: new Date(),
                status: exitStatus,
                ...(has_trailer_exit !== undefined && { has_trailer_exit })
            });

            logger.info('Exit registered', {
                sessionId: session.id_parking_sessions,
                status: exitStatus
            });

            return res.status(200).json({
                success: true,
                message: 'Salida registrada correctamente',
                data: {
                    sessionId: session.id_parking_sessions,
                    licensePlate: licensePlate || null,
                    temp_reference: temp_reference || null,
                    exitTime: session.exit_time,
                    status: exitStatus
                }
            });

        } catch (error) {
            logger.error('Error registering vehicle exit', { error });
            res.status(500).json({
                success: false,
                error: 'Error al registrar salida'
            });
        }
    }

    /**
     * GET /api/v1/vehicles/:plate/status
     * Obtener estado del vehículo
     */
    static async getStatus(req: Request, res: Response) {
        try {
            const { plate } = req.params;

            const session = await ParkingSession.findOne({
                include: [
                    {
                        model: Vehicle,
                        where: { license_plate: plate },
                        required: true
                    },
                    {
                        model: ParkingLot,
                        required: true
                    }
                ],
                where: { status: 'PARKED' }
            });

            if (!session) {
                const lastPaidSession = await ParkingSession.findOne({
                    include: [{
                        model: Vehicle,
                        where: { license_plate: plate }
                    }],
                    where: { status: 'EXITED_PAID' },
                    order: [['exit_time', 'DESC']]
                });

                if (lastPaidSession) {
                    return res.json({
                        success: true,
                        status: 'EXITED_PAID',
                        message: 'El vehículo puede salir',
                        canExit: true
                    });
                }

                return res.status(404).json({
                    success: false,
                    error: 'No se encontró sesión activa para este vehículo',
                });
            }

            let estimatedAmount = 0;
            try {
                estimatedAmount = await VehicleController.calculateAmount(
                    session.id_parking_sessions
                );
            } catch (error) {
                logger.warn('Could not calculate amount', { error });
            }

            const vehicle = await Vehicle.findByPk(session.id_vehicles);

            res.json({
                success: true,
                data: {
                    sessionId: session.id_parking_sessions,
                    licensePlate: vehicle?.license_plate,
                    status: session.status,
                    arrivalTime: session.arrival_time,
                    estimatedAmount: estimatedAmount,
                    canExit: session.status === 'EXITED_PAID',
                },
            });
        } catch (error) {
            logger.error('Error getting vehicle status', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener estado del vehículo',
            });
        }
    }
}
