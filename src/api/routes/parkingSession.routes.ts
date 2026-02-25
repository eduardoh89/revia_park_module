import { Router } from 'express';
import { ParkingSessionController } from '../controllers/ParkingSessionController';

const router = Router();

/**
 * GET /api/v1/parking-sessions/active
 * Listar sesiones activas (debe ir antes de /:id)
 */
router.get('/active', ParkingSessionController.getActive);

/**
 * GET /api/v1/parking-sessions
 * Listar todas las sesiones de estacionamiento
 */
router.get('/', ParkingSessionController.getAll);

/**
 * POST /api/v1/parking-sessions
 * Crear una nueva sesión de estacionamiento
 */
router.post('/', ParkingSessionController.create);

/**
 * GET /api/v1/parking-sessions/:id
 * Obtener una sesión por ID
 */
router.get('/:id', ParkingSessionController.getById);

/**
 * PUT /api/v1/parking-sessions/:id
 * Actualizar una sesión de estacionamiento
 */
router.put('/:id', ParkingSessionController.update);

/**
 * PATCH /api/v1/parking-sessions/:id/exit
 * Registrar salida de una sesión
 */
router.patch('/:id/exit', ParkingSessionController.registerExit);

/**
 * DELETE /api/v1/parking-sessions/:id
 * Eliminar una sesión de estacionamiento
 */
router.delete('/:id', ParkingSessionController.delete);

export default router;
