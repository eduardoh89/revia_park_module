import { Router } from 'express';
import { QRConfigController } from '../controllers/QRConfigController';

const router = Router();

/**
 * GET /api/v1/qr-configs/by-parking-lot/:id
 * Obtener config QR por id_parking_lots
 */
router.get('/by-parking-lot/:id', QRConfigController.getByParkingLot);

/**
 * PUT /api/v1/qr-configs/:id
 * Editar una configuración QR
 */
router.put('/:id', QRConfigController.update);

export default router;
