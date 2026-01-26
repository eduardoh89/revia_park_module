import { Request, Response } from 'express';
import { ParkingLot } from '../../models/ParkingLot';
import { Logger } from '../../shared/utils/logger';

const logger = new Logger('ParkingLotController');

export class ParkingLotController {
    /**
     * GET /api/v1/parking-lots
     * Listar todos los estacionamientos
     */
    static async getAll(req: Request, res: Response) {
        try {
            const parkingLots = await ParkingLot.findAll();

            res.json({
                success: true,
                data: parkingLots.map((lot) => ({
                    id: lot.id_parking_lots,
                    name: lot.name,
                    address: lot.address,
                })),
            });
        } catch (error) {
            logger.error('Error getting parking lots', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener estacionamientos',
            });
        }
    }

    /**
     * GET /api/v1/parking-lots/:id
     * Obtener un estacionamiento por ID
     */
    static async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const parkingLot = await ParkingLot.findByPk(parseInt(id));

            if (!parkingLot) {
                return res.status(404).json({
                    success: false,
                    error: 'Estacionamiento no encontrado',
                });
            }

            res.json({
                success: true,
                data: {
                    id: parkingLot.id_parking_lots,
                    name: parkingLot.name,
                    address: parkingLot.address,
                    phone: parkingLot.phone,
                    email: parkingLot.email,
                },
            });
        } catch (error) {
            logger.error('Error getting parking lot', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener estacionamiento',
            });
        }
    }
}
