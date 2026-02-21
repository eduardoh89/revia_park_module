import { Router } from 'express';
import { VehicleRateConfigController } from '../controllers/VehicleRateConfigController';

const router = Router();

/**
 * GET /api/v1/vehicle-rate-configs
 * Listar todas las configuraciones de tarifa
 */
router.get('/', VehicleRateConfigController.getAll);

export default router;
