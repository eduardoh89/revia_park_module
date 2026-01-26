import { Router, Request, Response } from 'express';
import paymentRoutes from './payment.routes';
import webhookRoutes from './webhook.routes';
import vehicleRoutes from './vehicle.routes';
import parkingLotRoutes from './parkingLot.routes';

const router = Router();

// Ruta principal - Index
router.get('/', (req: Request, res: Response) => {
  res.render('index', {
    title: 'REVIA - Sistema de Estacionamiento',
    whatsappLink: 'https://wa.me/56993157272?text=Hola%20quiero%20pagar%20mi%20estacionamiento'
  });
});

// Montar rutas con prefijo /api/v1
router.use('/api/v1/payments', paymentRoutes);
router.use('/api/v1/payment', paymentRoutes); // Alias para soportar configuración singular
router.use('/api/v1/webhooks', webhookRoutes);
router.use('/api/v1/vehicles', vehicleRoutes);
router.use('/api/v1/parking-lots', parkingLotRoutes);

export default router;
