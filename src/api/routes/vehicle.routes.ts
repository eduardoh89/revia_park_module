import { Router } from 'express';
import { VehicleController } from '../controllers/VehicleController';

const router = Router();

/**
 * POST /api/v1/vehicles/entry
 * Registrar entrada de vehículo
 */
router.post('/entry', VehicleController.registerEntry);

/**
 * GET /api/v1/vehicles/:plate/status
 * Obtener estado del vehículo
 */
router.get('/:plate/status', VehicleController.getStatus);

export default router;
