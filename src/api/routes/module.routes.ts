import { Router } from 'express';
import { ModuleController } from '../controllers/ModuleController';

const router = Router();

/**
 * GET /api/v1/modules
 * Listar todos los módulos
 */
router.get('/', ModuleController.getAll);

/**
 * GET /api/v1/modules/:id
 * Obtener un módulo por ID
 */
router.get('/:id', ModuleController.getById);

/**
 * POST /api/v1/modules
 * Crear un nuevo módulo
 */
router.post('/', ModuleController.create);

/**
 * PUT /api/v1/modules/:id
 * Actualizar un módulo
 */
router.put('/:id', ModuleController.update);

/**
 * DELETE /api/v1/modules/:id
 * Eliminar un módulo
 */
router.delete('/:id', ModuleController.delete);

export default router;
