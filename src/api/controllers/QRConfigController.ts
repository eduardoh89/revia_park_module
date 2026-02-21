import { Request, Response } from 'express';
import { QRConfig } from '../../models/QRConfig';
import { Logger } from '../../shared/utils/logger';

const logger = new Logger('QRConfigController');

export class QRConfigController {
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
                maskedPhone : `+${config.phone}`,
                message: config.message.trim(),
                domain: req.get('host'),
            });
        } catch (error) {
            logger.error('Error en redirección QR', { error });
            res.status(500).send('Error interno');
        }
    }
}
