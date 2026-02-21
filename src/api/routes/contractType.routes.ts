import { Router } from 'express';
import { ContractTypeController } from '../controllers/ContractTypeController';

const router = Router();

/**
 * GET /api/v1/contract-types
 * Listar todos los tipos de contrato
 */
router.get('/', ContractTypeController.getAll);

/**
 * GET /api/v1/contract-types/:id
 * Obtener un tipo de contrato por ID
 */
router.get('/:id', ContractTypeController.getById);

/**
 * POST /api/v1/contract-types
 * Crear un nuevo tipo de contrato
 */
router.post('/', ContractTypeController.create);

/**
 * PUT /api/v1/contract-types/:id
 * Actualizar un tipo de contrato
 */
router.put('/:id', ContractTypeController.update);

/**
 * DELETE /api/v1/contract-types/:id
 * Eliminar un tipo de contrato
 */
router.delete('/:id', ContractTypeController.delete);

export default router;
