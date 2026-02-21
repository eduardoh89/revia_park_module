import { Router } from 'express';
import { ContractRateController } from '../controllers/ContractRateController';

const router = Router();

/**
 * GET /api/v1/contract-rates
 * Listar todas las tarifas de contrato
 */
router.get('/', ContractRateController.getAll);

/**
 * GET /api/v1/contract-rates/:id
 * Obtener una tarifa de contrato por ID
 */
router.get('/:id', ContractRateController.getById);

/**
 * POST /api/v1/contract-rates
 * Crear una nueva tarifa de contrato
 */
router.post('/', ContractRateController.create);

/**
 * PUT /api/v1/contract-rates/:id
 * Actualizar una tarifa de contrato
 */
router.put('/:id', ContractRateController.update);

/**
 * DELETE /api/v1/contract-rates/:id
 * Eliminar una tarifa de contrato
 */
router.delete('/:id', ContractRateController.delete);

export default router;
