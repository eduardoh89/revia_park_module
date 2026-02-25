import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';

const router = Router();

/**
 * POST /api/v1/payments/create-link
 * Crear link de pago temporal (usado por WhatsApp Bot)
 */
router.post('/create-link', PaymentController.createPaymentLink);

/**
 * POST /api/v1/payments/create
 * Alias para compatibilidad con WhatsApp Bot
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

/**
 * GET /api/v1/payments
 * Listar todos los pagos
 */
router.get('/', PaymentController.getAll);

/**
 * POST /api/v1/payments
 * Crear un pago directamente
 */
router.post('/', PaymentController.create);

/**
 * GET /api/v1/payments/:id
 * Obtener un pago por ID
 */
router.get('/:id', PaymentController.getById);

/**
 * PUT /api/v1/payments/:id
 * Actualizar un pago
 */
router.put('/:id', PaymentController.update);

/**
 * DELETE /api/v1/payments/:id
 * Eliminar un pago
 */
router.delete('/:id', PaymentController.delete);

export default router;
