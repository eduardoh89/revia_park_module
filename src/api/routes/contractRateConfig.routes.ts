import { Router } from 'express';
import { ContractRateConfigController } from '../controllers/ContractRateConfigController';

const router = Router();

/**
 * GET /api/v1/contract-rate-configs
 * Listar todas las configuraciones de tarifa de contrato
 */
router.get('/', ContractRateConfigController.getAll);

export default router;
