import { Router } from 'express';
import { CompanyController } from '../controllers/CompanyController';

const router = Router();

/**
 * GET /api/v1/companies
 * Listar todas las empresas
 */
router.get('/', CompanyController.getAll);

/**
 * GET /api/v1/companies/:id
 * Obtener una empresa por ID
 */
router.get('/:id', CompanyController.getById);

/**
 * POST /api/v1/companies
 * Crear una nueva empresa
 */
router.post('/', CompanyController.create);

/**
 * PUT /api/v1/companies/:id
 * Actualizar una empresa
 */
router.put('/:id', CompanyController.update);

/**
 * DELETE /api/v1/companies/:id
 * Eliminar una empresa
 */
router.delete('/:id', CompanyController.delete);

export default router;
