import { Router } from 'express';
import { VehicleRateController } from '../controllers/VehicleRateController';

const router = Router();

/**
 * GET /api/v1/vehicle-rates
 * Listar todas las tarifas de vehículo
 */
router.get('/', VehicleRateController.getAll);

/**
 * GET /api/v1/vehicle-rates/:id
 * Obtener una tarifa de vehículo por ID
 */
router.get('/:id', VehicleRateController.getById);

/**
 * POST /api/v1/vehicle-rates
 * Crear una nueva tarifa de vehículo
 */
router.post('/', VehicleRateController.create);

/**
 * PUT /api/v1/vehicle-rates/:id
 * Actualizar una tarifa de vehículo
 */
router.put('/:id', VehicleRateController.update);

/**
 * DELETE /api/v1/vehicle-rates/:id
 * Eliminar una tarifa de vehículo
 */
router.delete('/:id', VehicleRateController.delete);

export default router;
