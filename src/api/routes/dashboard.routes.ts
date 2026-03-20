import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';

const router = Router();

/**
 * GET /api/v1/dashboard/kpis?parking_lot_id=1
 * KPIs principales: vehículos hoy, ingresos hoy, sesiones activas, pagos pendientes
 */
router.get('/kpis', DashboardController.getKpis);

/**
 * GET /api/v1/dashboard/vehicles-per-hour?parking_lot_id=1&date=2026-03-02
 * Distribución de vehículos ingresados por hora del día
 */
router.get('/vehicles-per-hour', DashboardController.getVehiclesPerHour);

/**
 * GET /api/v1/dashboard/weekly-revenue?parking_lot_id=1
 * Ingresos de los últimos 7 días
 */
router.get('/weekly-revenue', DashboardController.getWeeklyRevenue);

/**
 * GET /api/v1/dashboard/vehicle-types?parking_lot_id=1&date=2026-03-02
 * Distribución de tipos de vehículo con porcentajes
 */
router.get('/vehicle-types', DashboardController.getVehicleTypes);

/**
 * GET /api/v1/dashboard/recent-activity?parking_lot_id=1&limit=10
 * Últimos movimientos de entrada y salida combinados
 */
router.get('/recent-activity', DashboardController.getRecentActivity);

export default router;
