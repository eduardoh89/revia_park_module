import { Router } from 'express';
import { PaymentMethodController } from '../controllers/PaymentMethodController';

const router = Router();

/**
 * GET /api/v1/payment-methods
 * Listar todos los métodos de pago
 */
router.get('/', PaymentMethodController.getAll);

/**
 * POST /api/v1/payment-methods
 * Crear un nuevo método de pago
 */
router.post('/', PaymentMethodController.create);

/**
 * GET /api/v1/payment-methods/:id
 * Obtener un método de pago por ID
 */
router.get('/:id', PaymentMethodController.getById);

/**
 * PUT /api/v1/payment-methods/:id
 * Actualizar un método de pago
 */
router.put('/:id', PaymentMethodController.update);

/**
 * DELETE /api/v1/payment-methods/:id
 * Eliminar un método de pago
 */
router.delete('/:id', PaymentMethodController.delete);

export default router;
