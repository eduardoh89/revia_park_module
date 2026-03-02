import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { UnidentifiedVehicle } from '../../models/UnidentifiedVehicle';
import { Vehicle } from '../../models/Vehicle';
import { Logger } from '../../shared/utils/logger';
import { Exception } from '../../models/Exception';
import { ParkingSession } from '../../models/ParkingSession';

const logger = new Logger('UnidentifiedVehicleController');

export class UnidentifiedVehicleController {

    /**
     * GET /api/v1/unidentified-vehicles
     */
    static async getAll(req: Request, res: Response) {
        try {
            const records = await UnidentifiedVehicle.findAll({
                include: [{ model: Vehicle, required: false }],
                order: [['id_unidentified_vehicles', 'DESC']]
            });

            res.json({ success: true, data: records });
        } catch (error) {
            logger.error('Error getting unidentified vehicles', { error });
            res.status(500).json({ success: false, error: 'Error al obtener vehículos no identificados' });
        }
    }

    /**
     * GET /api/v1/unidentified-vehicles/:id
     */
    static async getById(req: Request, res: Response) {
        try {
            const parsedId = parseInt(req.params.id);
            if (isNaN(parsedId)) {
                return res.status(400).json({ success: false, error: 'El id debe ser un número válido' });
            }

            const record = await UnidentifiedVehicle.findByPk(parsedId, {
                include: [{ model: Vehicle, required: false }]
            });

            if (!record) {
                return res.status(404).json({ success: false, error: 'Vehículo no identificado no encontrado' });
            }

            res.json({ success: true, data: record });
        } catch (error) {
            logger.error('Error getting unidentified vehicle', { error });
            res.status(500).json({ success: false, error: 'Error al obtener vehículo no identificado' });
        }
    }

    /**
     * POST /api/v1/unidentified-vehicles
     */
    static async create(req: Request, res: Response) {
        try {
            const { temp_reference, capture_image_url, notes, movement_type, id_vehicles } = req.body;

            const validMovementTypes = ['ENTRY', 'EXIT'];
            if (movement_type && !validMovementTypes.includes(movement_type)) {
                return res.status(400).json({
                    success: false,
                    error: `movement_type inválido. Valores permitidos: ${validMovementTypes.join(', ')}`
                });
            }

            const generatedRef = temp_reference || `TEMP-${Math.floor(Date.now() / 1000)}`;

            const record = await UnidentifiedVehicle.create({
                temp_reference: generatedRef,
                capture_image_url: capture_image_url || null,
                notes: notes || null,
                movement_type: movement_type || null,
                created_at: new Date(),
                id_vehicles: id_vehicles || null
            });

            const created = await UnidentifiedVehicle.findByPk(record.id_unidentified_vehicles, {
                include: [{ model: Vehicle, required: false }]
            });

            logger.info('Unidentified vehicle created', { id: record.id_unidentified_vehicles });
            res.status(201).json({ success: true, data: created });
        } catch (error) {
            logger.error('Error creating unidentified vehicle', { error });
            res.status(500).json({ success: false, error: 'Error al crear vehículo no identificado' });
        }
    }

    /**
     * PUT /api/v1/unidentified-vehicles/:id
     */
    static async update(req: Request, res: Response) {
        try {
            const record = await UnidentifiedVehicle.findByPk(parseInt(req.params.id));
            if (!record) {
                return res.status(404).json({ success: false, error: 'Vehículo no identificado no encontrado' });
            }

            const { temp_reference, capture_image_url, notes, resolved_at, movement_type, id_vehicles } = req.body;

            if (resolved_at && !id_vehicles) {
                return res.status(400).json({
                    success: false,
                    error: 'id_vehicles es obligatorio al resolver un vehículo no identificado'
                });
            }

            await record.update({
                ...(temp_reference !== undefined && { temp_reference }),
                ...(capture_image_url !== undefined && { capture_image_url }),
                ...(notes !== undefined && { notes }),
                ...(resolved_at !== undefined && { resolved_at: resolved_at ? new Date(resolved_at) : null }),
                ...(movement_type !== undefined && { movement_type }),
                ...(id_vehicles !== undefined && { id_vehicles })
            });

            //id_unidentified_vehicles



            if (resolved_at) { // Entonces si se resolvió, se actualiza el vehículo asociado 

                const sessions = await ParkingSession.findOne({
                    where: { id_unidentified_vehicles: record.id_unidentified_vehicles },
                    raw: true,
                    nest: true,
                });
                if (sessions) {
                    const idParkingSessions = sessions.id_parking_sessions;
                    await ParkingSession.update(
                        { id_vehicles: id_vehicles },
                        { where: { id_parking_sessions: idParkingSessions } }
                    );

                    const ParkingException = await Exception.findOne({
                        where: { id_unidentified_vehicles: record.id_unidentified_vehicles },
                        raw: true,
                        nest: true,
                    });
                    if (ParkingException) {
                        const idParkingExceptions = ParkingException.id_parking_exceptions;
                        await Exception.update(
                            {
                                status: 'RESOLVED',
                                resolved_at: new Date()
                            },
                            { where: { id_parking_exceptions: idParkingExceptions } }
                        );
                    } else {
                        logger.warn('No se encontró excepción para el vehículo no identificado resuelto', { id_unidentified_vehicles: record.id_unidentified_vehicles });
                    }


                } else {
                    logger.warn('No se encontró sesión de parking para el vehículo no identificado resuelto', { id_unidentified_vehicles: record.id_unidentified_vehicles });
                }





            }

            const updated = await UnidentifiedVehicle.findByPk(record.id_unidentified_vehicles, {
                include: [{ model: Vehicle, required: false }]
            });

            res.json({ success: true, data: updated });
        } catch (error) {
            logger.error('Error updating unidentified vehicle', { error });
            res.status(500).json({ success: false, error: 'Error al actualizar vehículo no identificado' });
        }
    }

    /**
     * POST /api/v1/unidentified-vehicles/by-date
     * Busca por created_at usando hora local del servidor (sin Z)
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

            // Sin "Z" → toma la hora local del servidor, evita desfase de zona horaria
            const start = new Date(`${date}T00:00:00.000`);
            const end = new Date(`${date}T23:59:59.999`);

            if (isNaN(start.getTime())) {
                return res.status(400).json({
                    success: false,
                    error: 'Formato de fecha inválido. Use YYYY-MM-DD'
                });
            }

            const records = await UnidentifiedVehicle.findAll({
                where: {
                    created_at: { [Op.between]: [start, end] }
                },
                include: [{ model: Vehicle, required: false }],
                order: [['created_at', 'ASC']]
            });

            res.json({
                success: true,
                data: records,
                count: records.length
            });
        } catch (error) {
            logger.error('Error getting unidentified vehicles by date', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener vehículos no identificados por fecha'
            });
        }
    }

    /**
     * DELETE /api/v1/unidentified-vehicles/:id
     */
    static async delete(req: Request, res: Response) {
        try {
            const record = await UnidentifiedVehicle.findByPk(parseInt(req.params.id));
            if (!record) {
                return res.status(404).json({ success: false, error: 'Vehículo no identificado no encontrado' });
            }

            await record.destroy();
            res.json({ success: true, message: 'Vehículo no identificado eliminado correctamente' });
        } catch (error) {
            logger.error('Error deleting unidentified vehicle', { error });
            res.status(500).json({ success: false, error: 'Error al eliminar vehículo no identificado' });
        }
    }
}
