import { Router } from 'express';
import { VehicleController } from '../controllers/VehicleController';

const router = Router();

/**
 * GET /api/v1/vehicles
 * Listar todos los vehículos
 */
router.get('/', VehicleController.getAll);

/**
 * POST /api/v1/vehicles
 * Crear un nuevo vehículo
 */
router.post('/', VehicleController.create);

/**
 * POST /api/v1/vehicles/entry
 * Registrar entrada de vehículo
 */
router.post('/entry', VehicleController.registerEntry);

/**
 * GET /api/v1/vehicles/:id
 * Obtener un vehículo por ID
 */
router.get('/:id', VehicleController.getById);

/**
 * PUT /api/v1/vehicles/:id
 * Actualizar un vehículo
 */
router.put('/:id', VehicleController.update);

/**
 * DELETE /api/v1/vehicles/:id
 * Eliminar un vehículo
 */
router.delete('/:id', VehicleController.delete);

/**
 * GET /api/v1/vehicles/:plate/status
 * Obtener estado del vehículo
 */
router.get('/:plate/status', VehicleController.getStatus);

export default router;
