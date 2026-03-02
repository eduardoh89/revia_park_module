import { Router } from 'express';
import { UnidentifiedVehicleController } from '../controllers/UnidentifiedVehicleController';

const router = Router();

router.get('/', UnidentifiedVehicleController.getAll);
router.post('/', UnidentifiedVehicleController.create);
router.post('/by-date', UnidentifiedVehicleController.getByDate);
router.get('/:id', UnidentifiedVehicleController.getById);
router.put('/:id', UnidentifiedVehicleController.update);
router.delete('/:id', UnidentifiedVehicleController.delete);

export default router;
