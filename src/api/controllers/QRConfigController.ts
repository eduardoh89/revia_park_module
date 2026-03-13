import { Request, Response } from 'express';
import { QRConfig } from '../../models/QRConfig';
import { ParkingLot } from '../../models/ParkingLot';
import { Logger } from '../../shared/utils/logger';

const logger = new Logger('QRConfigController');

export class QRConfigController {

    /**
     * GET /r/:slug
     * Redirección QR → WhatsApp
     */
    static async redirect(req: Request, res: Response): Promise<void> {
        try {
            const { slug } = req.params;

            const config = await QRConfig.findOne({
                where: { slug, active: 1 }
            });

            if (!config) {
                res.status(404).send('QR no encontrado');
                return;
            }

            const whatsappUrl = `https://wa.me/${config.phone}?text=${encodeURIComponent(config.message)}`;

            res.render('qr', {
                title: 'REVIA - Verificación QR',
                whatsappUrl,
                maskedPhone: `+${config.phone}`,
                message: config.message.trim(),
                domain: req.get('host'),
            });
        } catch (error) {
            logger.error('Error en redirección QR', { error });
            res.status(500).send('Error interno');
        }
    }

    /**
     * GET /api/v1/qr-configs/by-parking-lot/:id
     * Obtener la config QR de un estacionamiento específico
     */
    static async getByParkingLot(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                res.status(400).json({ success: false, error: 'El id debe ser un número válido' });
                return;
            }

            const config = await QRConfig.findOne({
                where: { id_parking_lots: id },
                include: [{ model: ParkingLot }]
            });

            if (!config) {
                res.status(404).json({ success: false, error: 'Configuración QR no encontrada para este estacionamiento' });
                return;
            }

            res.json({ success: true, data: config });
        } catch (error) {
            logger.error('Error getting QR config by parking lot', { error });
            res.status(500).json({ success: false, error: 'Error al obtener configuración QR' });
        }
    }

    /**
     * PUT /api/v1/qr-configs/:id
     * Editar una configuración QR
     */
    static async update(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            const { slug, phone, message, active } = req.body;

            if (isNaN(id)) {
                res.status(400).json({ success: false, error: 'El id debe ser un número válido' });
                return;
            }

            const config = await QRConfig.findByPk(id);

            if (!config) {
                res.status(404).json({ success: false, error: 'Configuración QR no encontrada' });
                return;
            }

            await config.update({
                ...(slug !== undefined && { slug }),
                ...(phone !== undefined && { phone }),
                ...(message !== undefined && { message }),
                ...(active !== undefined && { active }),
                updated_at: new Date()
            });

            const updated = await QRConfig.findByPk(id, {
                include: [{ model: ParkingLot }]
            });

            logger.info('QR config updated', { id });

            res.json({ success: true, data: updated });
        } catch (error) {
            logger.error('Error updating QR config', { error });
            res.status(500).json({ success: false, error: 'Error al actualizar configuración QR' });
        }
    }
}
