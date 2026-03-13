import { Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../../config/database';
import { Logger } from '../../shared/utils/logger';

const logger = new Logger('DashboardController');

export class DashboardController {

    /**
     * GET /api/v1/dashboard/kpis?parking_lot_id=1
     * Retorna los 4 indicadores clave del dashboard:
     * - Vehículos ingresados hoy
     * - Ingresos del día (pagos completados)
     * - Sesiones activas (vehículos estacionados ahora)
     * - Pagos pendientes
     */
    static async getKpis(req: Request, res: Response) {
        try {
            const { parking_lot_id = 1 } = req.query;

            // Vehículos ingresados hoy
            const [vehiclesResult] = await sequelize.query<{ total: number }>(
                `SELECT COUNT(*) as total
                 FROM parking_sessions
                 WHERE DATE(arrival_time) = CURDATE()
                 AND id_parking_lots = :parking_lot_id`,
                { replacements: { parking_lot_id }, type: QueryTypes.SELECT }
            );

            // Ingresos hoy (solo pagos completados)
            const [revenueResult] = await sequelize.query<{ total: number }>(
                `SELECT COALESCE(SUM(p.amount), 0) as total
                 FROM payments p
                 JOIN parking_sessions ps ON p.id_parking_sessions = ps.id_parking_sessions
                 WHERE DATE(p.completed_at) = CURDATE()
                 AND p.status = 'COMPLETED'
                 AND ps.id_parking_lots = :parking_lot_id`,
                { replacements: { parking_lot_id }, type: QueryTypes.SELECT }
            );

            // Sesiones activas (vehículos estacionados en este momento)
            const [activeResult] = await sequelize.query<{ total: number }>(
                `SELECT COUNT(*) as total
                 FROM parking_sessions
                 WHERE status = 'PARKED'
                 AND id_parking_lots = :parking_lot_id`,
                { replacements: { parking_lot_id }, type: QueryTypes.SELECT }
            );

            // Pagos pendientes (links generados sin completar)
            const [pendingResult] = await sequelize.query<{ total: number }>(
                `SELECT COUNT(*) as total
                 FROM payments p
                 JOIN parking_sessions ps ON p.id_parking_sessions = ps.id_parking_sessions
                 WHERE p.status = 'PENDING'
                 AND ps.id_parking_lots = :parking_lot_id`,
                { replacements: { parking_lot_id }, type: QueryTypes.SELECT }
            );

            res.json({
                success: true,
                data: {
                    vehicles_today:    Number(vehiclesResult?.total  ?? 0),
                    revenue_today:     Number(revenueResult?.total   ?? 0),
                    active_sessions:   Number(activeResult?.total    ?? 0),
                    pending_payments:  Number(pendingResult?.total   ?? 0),
                }
            });
        } catch (error) {
            logger.error('Error getting dashboard KPIs', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener indicadores del dashboard'
            });
        }
    }

    /**
     * GET /api/v1/dashboard/vehicles-per-hour?parking_lot_id=1&date=2026-03-02
     * Retorna la cantidad de vehículos ingresados por hora del día indicado.
     * Si no se envía date, usa el día actual.
     * Devuelve las 24 horas (horas sin datos aparecen con count: 0).
     */
    static async getVehiclesPerHour(req: Request, res: Response) {
        try {
            const { parking_lot_id = 1, date } = req.query;
            const targetDate = date ?? new Date().toISOString().split('T')[0];

            const rows = await sequelize.query<{ hour: number; count: number }>(
                `SELECT HOUR(arrival_time) as hour, COUNT(*) as count
                 FROM parking_sessions
                 WHERE DATE(arrival_time) = :targetDate
                 AND id_parking_lots = :parking_lot_id
                 GROUP BY HOUR(arrival_time)
                 ORDER BY hour ASC`,
                { replacements: { targetDate, parking_lot_id }, type: QueryTypes.SELECT }
            );

            // Rellenar las 24 horas con 0 si no hay registros
            const hourlyData = Array.from({ length: 24 }, (_, i) => {
                const found = rows.find((r) => Number(r.hour) === i);
                return {
                    hour: i,
                    label: `${String(i).padStart(2, '0')}:00`,
                    count: found ? Number(found.count) : 0,
                };
            });

            res.json({
                success: true,
                data: hourlyData,
            });
        } catch (error) {
            logger.error('Error getting vehicles per hour', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener vehículos por hora',
            });
        }
    }

    /**
     * GET /api/v1/dashboard/weekly-revenue?parking_lot_id=1
     * Retorna los ingresos de los últimos 7 días (incluyendo hoy).
     * Días sin ingresos aparecen con total: 0.
     */
    static async getWeeklyRevenue(req: Request, res: Response) {
        try {
            const { parking_lot_id = 1 } = req.query;

            const rows = await sequelize.query<{ date: string; total: number }>(
                `SELECT DATE(p.completed_at) as date, COALESCE(SUM(p.amount), 0) as total
                 FROM payments p
                 JOIN parking_sessions ps ON p.id_parking_sessions = ps.id_parking_sessions
                 WHERE p.completed_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                 AND p.status = 'COMPLETED'
                 AND ps.id_parking_lots = :parking_lot_id
                 GROUP BY DATE(p.completed_at)
                 ORDER BY date ASC`,
                { replacements: { parking_lot_id }, type: QueryTypes.SELECT }
            );

            const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

            // Generar los últimos 7 días rellenando con 0 los días sin datos
            const weeklyData = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                const dateStr = d.toISOString().split('T')[0];
                const found = rows.find((r) => r.date === dateStr);
                return {
                    date:     dateStr,
                    day:      dayLabels[d.getDay()],
                    total:    found ? Number(found.total) : 0,
                    is_today: i === 6,
                };
            });

            res.json({
                success: true,
                data: weeklyData,
            });
        } catch (error) {
            logger.error('Error getting weekly revenue', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener ingresos semanales',
            });
        }
    }

    /**
     * GET /api/v1/dashboard/vehicle-types?parking_lot_id=1&date=2026-03-02
     * Retorna la distribución de tipos de vehículo del día indicado.
     * Si no se envía date, usa el día actual.
     * Incluye el porcentaje de cada tipo sobre el total.
     */
    static async getVehicleTypes(req: Request, res: Response) {
        try {
            const { parking_lot_id = 1, date } = req.query;
            const targetDate = date ?? new Date().toISOString().split('T')[0];

            const rows = await sequelize.query<{ name: string; code: string; count: number }>(
                `SELECT vt.name, vt.code, COUNT(*) as count
                 FROM parking_sessions ps
                 JOIN vehicles v        ON ps.id_vehicles      = v.id_vehicles
                 JOIN vehicle_types vt  ON v.id_vehicle_types  = vt.id_vehicle_types
                 WHERE DATE(ps.arrival_time) = :targetDate
                 AND ps.id_parking_lots = :parking_lot_id
                 GROUP BY vt.id_vehicle_types, vt.name, vt.code
                 ORDER BY count DESC`,
                { replacements: { targetDate, parking_lot_id }, type: QueryTypes.SELECT }
            );

            const total = rows.reduce((sum, r) => sum + Number(r.count), 0);

            const data = rows.map((r) => ({
                name:       r.name,
                code:       r.code,
                count:      Number(r.count),
                percentage: total > 0 ? Math.round((Number(r.count) / total) * 100) : 0,
            }));

            res.json({
                success: true,
                data,
                meta: { total },
            });
        } catch (error) {
            logger.error('Error getting vehicle types distribution', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener distribución de tipos de vehículo',
            });
        }
    }

    /**
     * GET /api/v1/dashboard/recent-activity?parking_lot_id=1&limit=10
     * Retorna los últimos movimientos (entradas y salidas) combinados,
     * ordenados por fecha descendente.
     */
    static async getRecentActivity(req: Request, res: Response) {
        try {
            const { parking_lot_id = 1, limit = 10 } = req.query;
            const safeLimit = Math.min(Number(limit), 50); // máximo 50

            // Entradas recientes
            const entries = await sequelize.query<{
                license_plate: string;
                event_time:    string;
                parking_lot:   string;
                movement_type: string;
            }>(
                `SELECT v.license_plate,
                        ps.arrival_time   AS event_time,
                        pl.name           AS parking_lot,
                        'ENTRY'           AS movement_type
                 FROM parking_sessions ps
                 JOIN vehicles     v  ON ps.id_vehicles      = v.id_vehicles
                 JOIN parking_lots pl ON ps.id_parking_lots  = pl.id_parking_lots
                 WHERE ps.id_parking_lots = :parking_lot_id
                 ORDER BY ps.arrival_time DESC
                 LIMIT :limit`,
                { replacements: { parking_lot_id, limit: safeLimit }, type: QueryTypes.SELECT }
            );

            // Salidas recientes
            const exits = await sequelize.query<{
                license_plate: string;
                event_time:    string;
                parking_lot:   string;
                movement_type: string;
            }>(
                `SELECT v.license_plate,
                        ps.exit_time      AS event_time,
                        pl.name           AS parking_lot,
                        'EXIT'            AS movement_type
                 FROM parking_sessions ps
                 JOIN vehicles     v  ON ps.id_vehicles      = v.id_vehicles
                 JOIN parking_lots pl ON ps.id_parking_lots  = pl.id_parking_lots
                 WHERE ps.exit_time IS NOT NULL
                 AND ps.id_parking_lots = :parking_lot_id
                 ORDER BY ps.exit_time DESC
                 LIMIT :limit`,
                { replacements: { parking_lot_id, limit: safeLimit }, type: QueryTypes.SELECT }
            );

            // Combinar, ordenar por fecha desc y limitar al total solicitado
            const combined = [...entries, ...exits]
                .sort((a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime())
                .slice(0, safeLimit);

            res.json({
                success: true,
                data: combined,
            });
        } catch (error) {
            logger.error('Error getting recent activity', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener actividad reciente',
            });
        }
    }
}
