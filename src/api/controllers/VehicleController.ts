import { Request, Response } from 'express';
import { AppDataSource } from '../../data-source';
import { Vehicle } from '../../entity/Vehicle';
import { ParkingSession, SessionStatus } from '../../entity/ParkingSession';
import { ParkingLot } from '../../entity/ParkingLot';
import { Logger } from '../../shared/utils/logger';

const logger = new Logger('VehicleController');
const vehicleRepository = AppDataSource.getRepository(Vehicle);
const sessionRepository = AppDataSource.getRepository(ParkingSession);
const parkingLotRepository = AppDataSource.getRepository(ParkingLot);

export class VehicleController {

    static calculateAmount(parkingLot: ParkingLot, arrivalTime: Date): number {
        const now = new Date();
        const diffMs = now.getTime() - arrivalTime.getTime();
        const diffMinutes = Math.ceil(diffMs / 60000);

        const hours = Math.ceil(diffMinutes / 60);
        let amount = hours * parkingLot.rate_per_hour;

        if (parkingLot.min_amount && amount < parkingLot.min_amount) {
            amount = parkingLot.min_amount;
        }

        return amount;
    }

    /**
     * POST /api/v1/vehicles/entry
     * Registrar entrada de vehículo al estacionamiento
     */
    static async registerEntry(req: Request, res: Response) {
        try {
            const { licensePlate, parkingLotId = 1 } = req.body;

            if (!licensePlate) {
                return res.status(400).json({
                    success: false,
                    error: 'La patente es requerida',
                });
            }

            const parkingLot = await parkingLotRepository.findOneBy({ id_parking_lots: parkingLotId });
            if (!parkingLot) {
                return res.status(404).json({
                    success: false,
                    error: 'Estacionamiento no encontrado',
                });
            }

            // Buscar si ya tiene sesión activa
            // JOIN implícito en ORM o query builder?
            // Usaremos query builder o findOne con relaciones
            const activeSession = await sessionRepository.createQueryBuilder("session")
                .innerJoinAndSelect("session.vehicle", "vehicle")
                .where("vehicle.license_plate = :plate", { plate: licensePlate })
                .andWhere("session.status = :status", { status: 'PARKED' })
                .getOne();

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

            // Buscar o crear vehículo
            let vehicle = await vehicleRepository.findOneBy({ license_plate: licensePlate });
            if (!vehicle) {
                vehicle = new Vehicle();
                vehicle.license_plate = licensePlate;
                await vehicleRepository.save(vehicle);
            }

            // Crear sesión
            const session = new ParkingSession();
            session.vehicle = vehicle;
            session.parkingLot = parkingLot;
            session.arrival_time = new Date();
            session.status = 'PARKED';

            const savedSession = await sessionRepository.save(session);

            logger.info('Vehicle entry registered', {
                licensePlate: vehicle.license_plate,
                sessionId: savedSession.id_parking_sessions,
                parkingLotId,
            });

            res.status(201).json({
                success: true,
                message: 'Entrada registrada correctamente',
                data: {
                    sessionId: savedSession.id_parking_sessions,
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

            const session = await sessionRepository.createQueryBuilder("session")
                .innerJoinAndSelect("session.vehicle", "vehicle")
                .innerJoinAndSelect("session.parkingLot", "parkingLot") // Necesario para calcular tarifa
                .where("vehicle.license_plate = :plate", { plate })
                .andWhere("session.status = :status", { status: 'PARKED' })
                .getOne();

            if (!session) {
                // Verificar si puede salir (último estado PAID con exit_time reciente?)
                // Por ahora, lógica simple: buscar el último pagado
                const lastPaidSession = await sessionRepository.createQueryBuilder("session")
                    .innerJoin("session.vehicle", "vehicle")
                    .where("vehicle.license_plate = :plate", { plate })
                    .andWhere("session.status = :status", { status: 'PAID' })
                    .orderBy("session.exit_time", "DESC") // Asumimos que exit_time se actualiza al pagar o salir
                    .getOne();

                if (lastPaidSession) {
                    // Podríamos poner un límite de tiempo aquí (ej. 15 min para salir)
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

            const amount = VehicleController.calculateAmount(session.parkingLot, session.arrival_time);

            res.json({
                success: true,
                data: {
                    sessionId: session.id_parking_sessions,
                    licensePlate: session.vehicle.license_plate,
                    status: session.status,
                    arrivalTime: session.arrival_time,
                    estimatedAmount: amount,
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
