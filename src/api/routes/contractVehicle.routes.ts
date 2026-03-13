import { Router } from 'express';
import { ContractVehicleController } from '../controllers/ContractVehicleController';

const router = Router();

router.get('/', ContractVehicleController.getAll);
router.get('/by-contract/:contractId', ContractVehicleController.getByContract);
router.get('/:id', ContractVehicleController.getById);
router.post('/', ContractVehicleController.create);
router.put('/:id', ContractVehicleController.update);
router.delete('/:id', ContractVehicleController.delete);

export default router;
