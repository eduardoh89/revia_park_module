import { ParkingSession } from '../../models/ParkingSession';
import { ParkingLotRate } from '../../models/ParkingLotRate';
import { Vehicle } from '../../models/Vehicle';
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
      const arrivalTime = new Date(session.arrival_time);
      const now = new Date();
      const diffMs = now.getTime() - arrivalTime.getTime();
      const timeInMinutes = Math.ceil(diffMs / 60000); // Redondear hacia arriba

      // Obtener el vehículo con su tipo
      const vehicle = await Vehicle.findByPk(session.id_vehicles);

      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      // Buscar la tarifa configurada para este estacionamiento y tipo de vehículo
      const rate = await ParkingLotRate.findOne({
        where: {
          id_parking_lots: session.id_parking_lots,
          id_vehicle_types: vehicle.id_vehicle_types
        }
      });

      let ratePerHour = this.DEFAULT_RATE_PER_HOUR;
      let ratePerMinute = 0;
      let minAmount = this.DEFAULT_MIN_AMOUNT;

      if (rate) {
        ratePerHour = rate.rate_per_hour;
        ratePerMinute = rate.rate_per_minute || Math.ceil(ratePerHour / 60);
        minAmount = rate.min_amount || this.DEFAULT_MIN_AMOUNT;
      } else {
        // Si no hay tarifa configurada, usar por minutos
        ratePerMinute = Math.ceil(ratePerHour / 60);
        logger.warn('No rate found for parking lot and vehicle type, using defaults', {
          parkingLotId: session.id_parking_lots,
          vehicleTypeId: vehicle.id_vehicle_types
        });
      }

      // Calcular monto basado en tiempo
      let calculatedAmount: number;

      if (timeInMinutes < 60) {
        // Menos de 1 hora: cobrar por minutos
        calculatedAmount = timeInMinutes * ratePerMinute;
      } else {
        // Más de 1 hora: cobrar por horas completas + minutos restantes
        const hours = Math.floor(timeInMinutes / 60);
        const remainingMinutes = timeInMinutes % 60;
        calculatedAmount = (hours * ratePerHour) + (remainingMinutes * ratePerMinute);
      }

      // Aplicar monto mínimo
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
