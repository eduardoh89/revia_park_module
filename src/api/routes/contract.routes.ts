import { Router } from 'express';
import { ContractController } from '../controllers/ContractController';

const router = Router();

router.get('/', ContractController.getAll);
router.post('/', ContractController.create);
router.get('/:id', ContractController.getById);
router.put('/:id', ContractController.update);
router.delete('/:id', ContractController.delete);

export default router;
