import { Router } from 'express';
import { ParkingSessionController } from '../controllers/ParkingSessionController';

const router = Router();

/**
 * GET /api/v1/parking-sessions/active
 * Listar sesiones activas (debe ir antes de /:id)
 */
router.get('/active', ParkingSessionController.getActive);
router.get('/is-parked/:id', ParkingSessionController.getIsParked);

/**
 * GET /api/v1/parking-sessions
 * Listar todas las sesiones de estacionamiento
 */
router.post('/filtered-parking', ParkingSessionController.postFilteredParkingSessions);

/**
 * POST /api/v1/parking-sessions
 * Crear una nueva sesión de estacionamiento
 */
router.post('/', ParkingSessionController.create);

/**
 * POST /api/v1/parking-sessions/create-with-exception
 * Crear sesión + excepción de ingreso manual, detecta contrato activo automáticamente
 */
router.post('/create-with-exception', ParkingSessionController.createWithException);

/**
 * POST /api/v1/parking-sessions/exception-sessions
 * Listar sesiones con excepción de ingreso manual (id_exception_types: 3)
 */
router.post('/exception-sessions', ParkingSessionController.postExceptionSessions);

/**
 * POST /api/v1/parking-sessions/by-date
 * Obtener sesiones por fecha (body: { date: "YYYY-MM-DD" })
 */
router.post('/by-date', ParkingSessionController.getByDate);

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
router.put('/update-with-exception/:id', ParkingSessionController.updateWithException);

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
