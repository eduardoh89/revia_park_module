import { Router } from 'express';
import { ParkingLotController } from '../controllers/ParkingLotController';

const router = Router();

/**
 * GET /api/v1/parking-lots
 * Listar todos los estacionamientos
 */
router.get('/', ParkingLotController.getAll);

/**
 * POST /api/v1/parking-lots
 * Crear un estacionamiento
 */
router.post('/', ParkingLotController.create);

/**
 * GET /api/v1/parking-lots/:id
 * Obtener un estacionamiento por ID
 */
router.get('/:id', ParkingLotController.getById);

/**
 * PUT /api/v1/parking-lots/:id
 * Editar un estacionamiento
 */
router.put('/:id', ParkingLotController.update);

export default router;
