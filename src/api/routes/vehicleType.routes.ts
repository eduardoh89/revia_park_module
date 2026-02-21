import { Router } from 'express';
import { VehicleTypeController } from '../controllers/VehicleTypeController';

const router = Router();

/**
 * GET /api/v1/vehicle-types
 * Listar todos los tipos de vehículo
 */
router.get('/', VehicleTypeController.getAll);

/**
 * GET /api/v1/vehicle-types/:id
 * Obtener un tipo de vehículo por ID
 */
router.get('/:id', VehicleTypeController.getById);

/**
 * POST /api/v1/vehicle-types
 * Crear un nuevo tipo de vehículo
 */
router.post('/', VehicleTypeController.create);

/**
 * PUT /api/v1/vehicle-types/:id
 * Actualizar un tipo de vehículo
 */
router.put('/:id', VehicleTypeController.update);

/**
 * DELETE /api/v1/vehicle-types/:id
 * Eliminar un tipo de vehículo
 */
router.delete('/:id', VehicleTypeController.delete);

export default router;
