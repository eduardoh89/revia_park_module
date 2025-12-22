import { Router } from 'express';
import { ParkingLotController } from '../controllers/ParkingLotController';

const router = Router();

/**
 * GET /api/v1/parking-lots
 * Listar todos los estacionamientos
 */
router.get('/', ParkingLotController.getAll);

/**
 * GET /api/v1/parking-lots/:id
 * Obtener un estacionamiento por ID
 */
router.get('/:id', ParkingLotController.getById);

export default router;
