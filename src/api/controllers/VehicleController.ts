import { Request, Response } from 'express';
import { Vehicle } from '../../models/Vehicle';
import { VehicleType } from '../../models/VehicleType';
import { ParkingSession, SessionStatus } from '../../models/ParkingSession';
import { ParkingLot } from '../../models/ParkingLot';
import { Logger } from '../../shared/utils/logger';
import { PaymentLinkService } from '../../whatsapp/services/PaymentLinkService';

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
                data: {
                    id: vehicle.id_vehicles,
                    licensePlate: vehicle.license_plate,
                    vehicleType: vehicle.vehicleType
                        ? { id: vehicle.vehicleType.id_vehicle_types, name: vehicle.vehicleType.name }
                        : null,
                    createdAt: vehicle.created_at,
                },
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
            const { license_plate, id_vehicle_types } = req.body;

            console.log(req.body);
            

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
            const { licensePlate, vehicleTypeId } = req.body;

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
     * POST /api/v1/vehicles/entry
     * Registrar entrada de vehículo al estacionamiento
     */
    static async registerEntry(req: Request, res: Response) {
        try {
            const { licensePlate, parkingLotId = 1, vehicleTypeId = 1 } = req.body;

            if (!licensePlate) {
                return res.status(400).json({
                    success: false,
                    error: 'La patente es requerida',
                });
            }

            const parkingLot = await ParkingLot.findByPk(parkingLotId);
            if (!parkingLot) {
                return res.status(404).json({
                    success: false,
                    error: 'Estacionamiento no encontrado',
                });
            }

            const activeSession = await ParkingSession.findOne({
                include: [{
                    model: Vehicle,
                    where: { license_plate: licensePlate }
                }],
                where: { status: 'PARKED' }
            });

            if (activeSession) {
                return res.status(409).json({
                    success: false,
                    error: 'El vehículo ya tiene una sesión activa',
                    session: {
                        id: activeSession.id_parking_sessions,
                        arrivalTime: activeSession.arrival_time,
                    },
                });
            }

            let vehicle = await Vehicle.findOne({ where: { license_plate: licensePlate } });
            if (!vehicle) {
                vehicle = await Vehicle.create({
                    license_plate: licensePlate,
                    id_vehicle_types: vehicleTypeId,
                });
            }

            const session = await ParkingSession.create({
                id_vehicles: vehicle.id_vehicles,
                id_parking_lots: parkingLot.id_parking_lots,
                arrival_time: new Date(),
                status: 'PARKED',
            });

            logger.info('Vehicle entry registered', {
                licensePlate: vehicle.license_plate,
                sessionId: session.id_parking_sessions,
                parkingLotId,
                vehicleTypeId: vehicle.id_vehicle_types,
            });

            res.status(201).json({
                success: true,
                message: 'Entrada registrada correctamente',
                data: {
                    sessionId: session.id_parking_sessions,
                    licensePlate: vehicle.license_plate,
                    parkingLot: parkingLot.name,
                    arrivalTime: session.arrival_time,
                },
            });
        } catch (error) {
            logger.error('Error registering vehicle entry', { error });
            res.status(500).json({
                success: false,
                error: 'Error al registrar entrada',
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
