import { Router } from 'express';
import { ContractController } from '../controllers/ContractController';

const router = Router();

router.get('/', ContractController.getAll);
router.get('/by-contract-rate-config', ContractController.getContractRateConfig);
router.post('/', ContractController.create);
router.get('/by-license-plate/:plate', ContractController.getByLicensePlate);
router.get('/:id', ContractController.getById);
router.put('/:id', ContractController.update);
router.delete('/:id', ContractController.delete);

router.post('/:id/cancel', ContractController.postContractCancel);

export default router;
