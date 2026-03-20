import { Router } from 'express';
import { RoleModulePermissionController } from '../controllers/RoleModulePermissionController';

const router = Router();

router.get('/', RoleModulePermissionController.getAll);
router.get('/role/:roleId', RoleModulePermissionController.getByRole);
router.get('/:id', RoleModulePermissionController.getById);
router.post('/', RoleModulePermissionController.create);
router.post('/bulk', RoleModulePermissionController.bulk);
router.put('/:id', RoleModulePermissionController.update);
router.delete('/:id', RoleModulePermissionController.delete);

export default router;
