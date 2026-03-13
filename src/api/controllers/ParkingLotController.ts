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
                data: parkingLots,
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
            const parsedId = parseInt(id);

            console.log(id);
            

            if (isNaN(parsedId)) {
                return res.status(400).json({
                    success: false,
                    error: 'El id debe ser un número válido',
                });
            }

            const parkingLot = await ParkingLot.findByPk(parsedId);

            if (!parkingLot) {
                return res.status(404).json({
                    success: false,
                    error: 'Estacionamiento no encontrado',
                });
            }

            res.json({
                success: true,
                data: parkingLot,
            });
        } catch (error) {
            logger.error('Error getting parking lot', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener estacionamiento',
            });
        }
    }

    /**
     * POST /api/v1/parking-lots
     * Crear un estacionamiento
     */
    static async create(req: Request, res: Response) {
        try {
            const { name, address, phone, email } = req.body;

            if (!name) {
                return res.status(400).json({
                    success: false,
                    error: 'El nombre es obligatorio',
                });
            }

            const parkingLot = await ParkingLot.create({
                name,
                address: address || null,
                phone: phone || null,
                email: email || null,
            });

            logger.info('Parking lot created', { id: parkingLot.id_parking_lots });

            res.status(201).json({
                success: true,
                data: parkingLot,
            });
        } catch (error) {
            logger.error('Error creating parking lot', { error });
            res.status(500).json({
                success: false,
                error: 'Error al crear estacionamiento',
            });
        }
    }

    /**
     * PUT /api/v1/parking-lots/:id
     * Editar un estacionamiento
     */
    static async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const parsedId = parseInt(id);
            const { name, address, phone, email } = req.body;

            if (isNaN(parsedId)) {
                return res.status(400).json({
                    success: false,
                    error: 'El id debe ser un número válido',
                });
            }

            const parkingLot = await ParkingLot.findByPk(parsedId);

            if (!parkingLot) {
                return res.status(404).json({
                    success: false,
                    error: 'Estacionamiento no encontrado',
                });
            }

            await parkingLot.update({
                ...(name !== undefined && { name }),
                ...(address !== undefined && { address }),
                ...(phone !== undefined && { phone }),
                ...(email !== undefined && { email }),
            });

            logger.info('Parking lot updated', { id: parsedId });

            res.json({
                success: true,
                data: parkingLot,
            });
        } catch (error) {
            logger.error('Error updating parking lot', { error });
            res.status(500).json({
                success: false,
                error: 'Error al actualizar estacionamiento',
            });
        }
    }
}
