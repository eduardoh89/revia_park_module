import { v4 as uuidv4 } from 'uuid';
import { KlapService } from '../../infrastructure/payment/KlapService';
import { Payment } from '../../models/Payment';
import { ParkingSession } from '../../models/ParkingSession';
import { Vehicle } from '../../models/Vehicle';
import { ParkingLotRate } from '../../models/ParkingLotRate';

export interface PaymentLinkResult {
    paymentUrl: string;
    amount: number;
    linkCode: string;
    expiresAt: Date;
}

/**
 * Servicio para generar links de pago desde los flows de WhatsApp
 */
export class PaymentLinkService {
    private klapService: KlapService;

    constructor() {
        this.klapService = new KlapService();
    }

    /**
     * Calcula el monto a pagar basándose en las tarifas del estacionamiento
     */
    private async calculateAmount(sessionId: number): Promise<number> {
        // Obtener la sesión con sus relaciones
        const session = await ParkingSession.findByPk(sessionId, {
            raw: true,
            nest: true,
        });
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        // Obtener el vehículo para saber su tipo
        const vehicle = await Vehicle.findByPk(session.id_vehicles, {
            raw: true,
            nest: true,
        });
        if (!vehicle) {
            throw new Error(`Vehicle not found for session ${sessionId}`);
        }

        console.log({
             id_parking_lots: session.id_parking_lots,
                id_vehicle_types: vehicle.id_vehicle_types
        });


        // Buscar la tarifa correspondiente al estacionamiento y tipo de vehículo
        const rate = await ParkingLotRate.findOne({
            where: {
                id_parking_lots: session.id_parking_lots,
                id_vehicle_types: vehicle.id_vehicle_types
            },
             raw: true,
            nest: true,
        });

        console.log(rate);
        

        if (!rate) {
            throw new Error(`No rate found for parking lot ${session.id_parking_lots} and vehicle type ${vehicle.id_vehicle_types}`);
        }

        // Calcular tiempo transcurrido en minutos
        const arrivalTime = new Date(session.arrival_time);
        const now = new Date();
        const diffMs = now.getTime() - arrivalTime.getTime();
        const diffMinutes = Math.ceil(diffMs / 60000); // Redondear hacia arriba

        let amount: number;

        if (rate.rate_per_minute) {
            // Calcular por minuto
            amount = diffMinutes * rate.rate_per_minute;
        } else {
            // Calcular por hora (redondeando hacia arriba)
            const hours = Math.ceil(diffMinutes / 60);
            amount = hours * rate.rate_per_hour;
        }

        // Aplicar monto mínimo si existe
        if (rate.min_amount && amount < rate.min_amount) {
            amount = rate.min_amount;
        }

        return amount;
    }

    /**
     * Genera un link de pago para una sesión de estacionamiento
     */
    async createPaymentLink(
        licensePlate: string,
        sessionId: number
    ): Promise<PaymentLinkResult> {
        const baseUrl = process.env.APP_URL || 'http://localhost:3000';
        const amount = await this.calculateAmount(sessionId);

        // Crear pago en Klap
        const klapPayment = await this.klapService.createPayment({
            amount: amount,
            description: `Pago estacionamiento - ${licensePlate}`,
            licensePlate: licensePlate,
            userEmail: '',
        });

        // Crear link temporal (expira en 5 minutos)
        const linkCode = uuidv4();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await Payment.create({
            order_id: klapPayment.orderId,
            reference_id: klapPayment.referenceId,
            amount: amount,
            status: 'PENDING',
            id_parking_sessions: sessionId,
            link_code: linkCode,
            link_is_used: false,
            link_expires_at: expiresAt,
        });

        const paymentUrl = `${baseUrl}/api/v1/payments/checkout?code=${linkCode}`;

        return {
            paymentUrl,
            amount,
            linkCode,
            expiresAt,
        };
    }
}
