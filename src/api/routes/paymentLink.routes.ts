import { Router } from 'express';
import { PaymentLinkController } from '../controllers/PaymentLinkController';

const router = Router();

/**
 * GET /api/v1/payment-links/by-code/:code
 * Obtener un link por su código (debe ir antes de /:id)
 */
router.get('/by-code/:code', PaymentLinkController.getByCode);

/**
 * GET /api/v1/payment-links
 * Listar todos los links de pago
 */
router.get('/', PaymentLinkController.getAll);

/**
 * POST /api/v1/payment-links
 * Crear un nuevo link de pago
 */
router.post('/', PaymentLinkController.create);

/**
 * GET /api/v1/payment-links/:id
 * Obtener un link de pago por ID
 */
router.get('/:id', PaymentLinkController.getById);

/**
 * PUT /api/v1/payment-links/:id
 * Actualizar un link de pago
 */
router.put('/:id', PaymentLinkController.update);

/**
 * PATCH /api/v1/payment-links/:id/use
 * Marcar un link como usado
 */
router.patch('/:id/use', PaymentLinkController.markAsUsed);

/**
 * DELETE /api/v1/payment-links/:id
 * Eliminar un link de pago
 */
router.delete('/:id', PaymentLinkController.delete);

export default router;
