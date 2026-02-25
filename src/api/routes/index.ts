import { Router, Request, Response } from 'express';
import paymentRoutes from './payment.routes';
import webhookRoutes from './webhook.routes';
import vehicleRoutes from './vehicle.routes';
import parkingLotRoutes from './parkingLot.routes';
import vehicleTypeRoutes from './vehicleType.routes';
import moduleItemRoutes from './moduleItem.routes';
import moduleRoutes from './module.routes';
import companyRoutes from './company.routes';
import contractTypeRoutes from './contractType.routes';
import vehicleRateRoutes from './vehicleRate.routes';
import vehicleRateConfigRoutes from './vehicleRateConfig.routes';
import contractRateRoutes from './contractRate.routes';
import contractRateConfigRoutes from './contractRateConfig.routes';
import parkingSessionRoutes from './parkingSession.routes';
import paymentMethodRoutes from './paymentMethod.routes';
import creditNoteRoutes from './creditNote.routes';
import paymentLinkRoutes from './paymentLink.routes';
import exceptionTypeRoutes from './exceptionType.routes';
import exceptionRoutes from './exception.routes';
import contractRoutes from './contract.routes';
import { QRConfigController } from '../controllers/QRConfigController';

const router = Router();

// Ruta principal - Index
router.get('/', (req: Request, res: Response) => {
  res.render('index', {
    title: 'REVIA - Sistema de Estacionamiento',
    whatsappLink: 'https://wa.me/56993157272?text=Hola%20quiero%20pagar%20mi%20estacionamiento'
  });
});

// Redirección QR → WhatsApp
router.get('/r/:slug', QRConfigController.redirect);

// Montar rutas con prefijo /api/v1
router.use('/api/v1/payments', paymentRoutes);
router.use('/api/v1/payment', paymentRoutes); // Alias para soportar configuración singular
router.use('/api/v1/webhooks', webhookRoutes);
router.use('/api/v1/vehicles', vehicleRoutes);
router.use('/api/v1/parking-lots', parkingLotRoutes);
router.use('/api/v1/vehicle-types', vehicleTypeRoutes);
router.use('/api/v1/module-items', moduleItemRoutes);
router.use('/api/v1/modules', moduleRoutes);
router.use('/api/v1/companies', companyRoutes);
router.use('/api/v1/contract-types', contractTypeRoutes);
router.use('/api/v1/vehicle-rates', vehicleRateRoutes);
router.use('/api/v1/vehicle-rate-configs', vehicleRateConfigRoutes);
router.use('/api/v1/contract-rates', contractRateRoutes);
router.use('/api/v1/contract-rate-configs', contractRateConfigRoutes);
router.use('/api/v1/parking-sessions', parkingSessionRoutes);
router.use('/api/v1/payment-methods', paymentMethodRoutes);
router.use('/api/v1/credit-notes', creditNoteRoutes);
router.use('/api/v1/payment-links', paymentLinkRoutes);
router.use('/api/v1/exception-types', exceptionTypeRoutes);
router.use('/api/v1/exceptions', exceptionRoutes);
router.use('/api/v1/contracts', contractRoutes);

export default router;
