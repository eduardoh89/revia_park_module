import { Router } from 'express';
import { ExceptionTypeController } from '../controllers/ExceptionTypeController';

const router = Router();

router.get('/', ExceptionTypeController.getAll);
router.post('/', ExceptionTypeController.create);
router.get('/:id', ExceptionTypeController.getById);
router.put('/:id', ExceptionTypeController.update);
router.delete('/:id', ExceptionTypeController.delete);

export default router;
