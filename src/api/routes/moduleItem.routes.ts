import { Router } from 'express';
import { ModuleItemController } from '../controllers/ModuleItemController';

const router = Router();

/**
 * GET /api/v1/module-items
 * Listar todos los items de módulo
 */
router.get('/', ModuleItemController.getAll);

/**
 * GET /api/v1/module-items/:id
 * Obtener un item de módulo por ID
 */
router.get('/:id', ModuleItemController.getById);

/**
 * POST /api/v1/module-items
 * Crear un nuevo item de módulo
 */
router.post('/', ModuleItemController.create);

/**
 * PUT /api/v1/module-items/:id
 * Actualizar un item de módulo
 */
router.put('/:id', ModuleItemController.update);

/**
 * DELETE /api/v1/module-items/:id
 * Eliminar un item de módulo
 */
router.delete('/:id', ModuleItemController.delete);

export default router;
