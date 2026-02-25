import { Router } from 'express';
import { CreditNoteController } from '../controllers/CreditNoteController';

const router = Router();

/**
 * GET /api/v1/credit-notes
 * Listar todas las notas de crédito
 */
router.get('/', CreditNoteController.getAll);

/**
 * POST /api/v1/credit-notes
 * Crear una nueva nota de crédito
 */
router.post('/', CreditNoteController.create);

/**
 * GET /api/v1/credit-notes/:id
 * Obtener una nota de crédito por ID
 */
router.get('/:id', CreditNoteController.getById);

/**
 * PUT /api/v1/credit-notes/:id
 * Actualizar una nota de crédito
 */
router.put('/:id', CreditNoteController.update);

/**
 * DELETE /api/v1/credit-notes/:id
 * Eliminar una nota de crédito
 */
router.delete('/:id', CreditNoteController.delete);

export default router;
