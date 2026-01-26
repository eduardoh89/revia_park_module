import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';

const router = Router();

/**
 * POST /api/v1/payments/create
 * Crear link de pago temporal (usado por WhatsApp Bot)
 * Retorna: { paymentUrl, expiresAt, amount, licensePlate }
 */
router.post('/create', PaymentController.createPaymentLink);

/**
 * GET /api/v1/payments/checkout?code=xxx
 * Mostrar formulario de pago usando el código del link temporal
 */
router.get('/checkout', PaymentController.checkout);

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

/**
 * GET /api/v1/payments/error
 * Página de error
 */
router.get('/error', PaymentController.error);

export default router;
