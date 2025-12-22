import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';

const router = Router();

/**
 * POST /api/v1/payments/create
 * Crear un nuevo pago
 */
router.post('/create', PaymentController.checkout);

/**
 * GET /api/v1/payments/success
 * Página de éxito (redirección desde Klap)
 */
router.get('/success', PaymentController.success);

/**
 * GET /api/v1/payments/cancel
 * Página de cancelación
 */
router.get('/cancel', PaymentController.cancel);

export default router;
