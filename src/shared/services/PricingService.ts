import { Op } from 'sequelize';
import { ParkingSession } from '../../models/ParkingSession';
import { Vehicle } from '../../models/Vehicle';
import { VehicleRate } from '../../models/VehicleRate';
import { VehicleRateConfig } from '../../models/VehicleRateConfig';
import { Logger } from '../utils/logger';

const logger = new Logger('PricingService');

export interface PricingCalculation {
  amount: number;
  timeInMinutes: number;
  ratePerHour: number;
  ratePerMinute: number;
  minAmount: number;
  appliedMinimum: boolean;
}

export class PricingService {
  /**
   * Monto mínimo por defecto si no hay configuración en la tabla
   */
  private static readonly DEFAULT_MIN_AMOUNT = 1200;

  /**
   * Tarifa por hora por defecto si no hay configuración en la tabla
   */
  private static readonly DEFAULT_RATE_PER_HOUR = 2000;

  /**
   * Calcula el precio de estacionamiento basado en la sesión
   */
  static async calculatePrice(session: ParkingSession): Promise<PricingCalculation> {
    try {
      // Calcular tiempo transcurrido en minutos
      const arrivalTime = new Date(session.arrival_time!);
      const now = new Date();
      const diffMs = now.getTime() - arrivalTime.getTime();
      const timeInMinutes = Math.ceil(diffMs / 60000); // Redondear hacia arriba

      // Obtener el vehículo con su tipo
      const vehicle = await Vehicle.findByPk(session.id_vehicles);

      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      // Buscar tarifa activa para el tipo de vehículo vigente hoy
      const today = new Date().toISOString().split('T')[0];
      const rate = await VehicleRate.findOne({
        where: {
          id_vehicle_types: vehicle.id_vehicle_types,
          is_active: 1,
          start_date: { [Op.lte]: today },
          [Op.or]: [
            { end_date: null },
            { end_date: { [Op.gte]: today } }
          ]
        },
        include: [{ model: VehicleRateConfig }],
        order: [['start_date', 'DESC']]
      });

      let calculatedAmount = 0;
      let ratePerHour = this.DEFAULT_RATE_PER_HOUR;
      let ratePerMinute = Math.ceil(this.DEFAULT_RATE_PER_HOUR / 60);
      const minAmount = this.DEFAULT_MIN_AMOUNT;

      if (!rate) {
        logger.warn('No active vehicle rate found, using defaults', {
          vehicleTypeId: vehicle.id_vehicle_types
        });
        calculatedAmount = timeInMinutes * ratePerMinute;
      } else {
        const config = rate.vehicleRateConfig;
        const fields = config?.fields ?? '';

        if (fields.includes('price_per_minute')) {
          ratePerMinute = rate.price_per_minute ?? ratePerMinute;
          ratePerHour = ratePerMinute * 60;
          calculatedAmount = timeInMinutes * ratePerMinute;
          if (rate.daily_limit && calculatedAmount > rate.daily_limit) {
            calculatedAmount = rate.daily_limit;
          }
        } else if (fields.includes('price_per_block')) {
          const blockDuration = rate.block_duration_min ?? 1;
          const blocks = Math.ceil(timeInMinutes / blockDuration);
          calculatedAmount = blocks * (rate.price_per_block ?? 0);
          ratePerHour = rate.price_per_block ?? 0;
          ratePerMinute = 0;
        }
      }

      const finalAmount = Math.max(calculatedAmount, minAmount);
      const appliedMinimum = finalAmount === minAmount && calculatedAmount < minAmount;

      logger.info('Price calculated', {
        sessionId: session.id_parking_sessions,
        licensePlate: vehicle.license_plate,
        timeInMinutes,
        calculatedAmount,
        finalAmount,
        appliedMinimum
      });

      return {
        amount: finalAmount,
        timeInMinutes,
        ratePerHour,
        ratePerMinute,
        minAmount,
        appliedMinimum
      };
    } catch (error) {
      logger.error('Error calculating price', { error, sessionId: session.id_parking_sessions });
      throw error;
    }
  }

  /**
   * Calcula el precio estimado por tiempo en minutos
   */
  static estimatePrice(
    timeInMinutes: number,
    ratePerHour: number,
    ratePerMinute: number,
    minAmount: number = this.DEFAULT_MIN_AMOUNT
  ): number {
    let calculatedAmount: number;

    if (timeInMinutes < 60) {
      calculatedAmount = timeInMinutes * ratePerMinute;
    } else {
      const hours = Math.floor(timeInMinutes / 60);
      const remainingMinutes = timeInMinutes % 60;
      calculatedAmount = (hours * ratePerHour) + (remainingMinutes * ratePerMinute);
    }

    return Math.max(calculatedAmount, minAmount);
  }
}
