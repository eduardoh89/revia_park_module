import { Router } from 'express';
import { ExceptionController } from '../controllers/ExceptionController';

const router = Router();

router.get('/', ExceptionController.getAll);
router.post('/', ExceptionController.create);
router.get('/:id', ExceptionController.getById);
router.put('/:id', ExceptionController.update);
router.patch('/:id/resolve', ExceptionController.resolve);
router.delete('/:id', ExceptionController.delete);

export default router;
