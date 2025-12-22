import { Router } from 'express';
import { WebhookController } from '../controllers/WebhookController';

const router = Router();

/**
 * POST /api/v1/webhooks/klap/validation
 * Webhook de validación - Se llama cuando se crea una orden
 */
router.post('/klap/validation', WebhookController.webhookValidation);

/**
 * POST /api/v1/webhooks/klap/confirm
 * Webhook de confirmación - Se llama cuando el pago es exitoso
 */
router.post('/klap/confirm', WebhookController.webhookConfirm);

/**
 * POST /api/v1/webhooks/klap/reject
 * Webhook de rechazo - Se llama cuando el pago falla
 */
router.post('/klap/reject', WebhookController.webhookReject);

/**
 * GET /api/v1/webhooks/health
 * Health check para webhooks
 */
router.get('/health', WebhookController.healthCheck);

export default router;
