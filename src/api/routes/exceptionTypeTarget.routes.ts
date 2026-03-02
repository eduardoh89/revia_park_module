import { Router } from 'express';
import { ExceptionTypeTargetController } from '../controllers/ExceptionTypeTargetController';

const router = Router();

router.get('/', ExceptionTypeTargetController.getAll);

export default router;
