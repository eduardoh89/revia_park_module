import { Request, Response } from 'express';
import { Vehicle } from '../../models/Vehicle';
import { ParkingSession, SessionStatus } from '../../models/ParkingSession';
import { ParkingLot } from '../../models/ParkingLot';
import { ParkingLotRate } from '../../models/ParkingLotRate';
import { Logger } from '../../shared/utils/logger';

const logger = new Logger('VehicleController');

export class VehicleController {

    /**
     * Calcular el monto a pagar basado en la tarifa del estacionamiento y tipo de vehículo
     */
    static async calculateAmount(parkingLotId: number, vehicleTypeId: number, arrivalTime: Date): Promise<number> {
        const rate = await ParkingLotRate.findOne({
            where: {
                id_parking_lots: parkingLotId,
                id_vehicle_types: vehicleTypeId,
            },
        });

        if (!rate) {
            throw new Error(`No se encontró tarifa para el estacionamiento ${parkingLotId} y tipo de vehículo ${vehicleTypeId}`);
        }

        const now = new Date();
        const diffMs = now.getTime() - arrivalTime.getTime();
        const diffMinutes = Math.ceil(diffMs / 60000);

        let amount = 0;

        if (rate.rate_per_minute) {
            amount = diffMinutes * rate.rate_per_minute;
        } else {
            const hours = Math.ceil(diffMinutes / 60);
            amount = hours * rate.rate_per_hour;
        }

        if (rate.min_amount && amount < rate.min_amount) {
            amount = rate.min_amount;
        }

        return amount;
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
                    where: { status: 'PAID' },
                    order: [['exit_time', 'DESC']]
                });

                if (lastPaidSession) {
                    return res.json({
                        success: true,
                        status: 'PAID',
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
                const vehicle = await Vehicle.findByPk(session.id_vehicles);
                estimatedAmount = await VehicleController.calculateAmount(
                    session.id_parking_lots,
                    vehicle!.id_vehicle_types,
                    session.arrival_time
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
                    canExit: session.status === 'PAID',
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
