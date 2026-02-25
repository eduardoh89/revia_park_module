import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { KlapService } from '../../infrastructure/payment/KlapService';
import { Payment } from '../../models/Payment';
import { PaymentLink } from '../../models/PaymentLink';
import { PaymentMethod } from '../../models/PaymentMethod';
import { ParkingSession } from '../../models/ParkingSession';
import { Vehicle } from '../../models/Vehicle';
import { VehicleRate } from '../../models/VehicleRate';
import { VehicleRateConfig } from '../../models/VehicleRateConfig';

export interface PaymentLinkResult {
    paymentUrl: string;
    amount: number;
    linkCode: string;
    expiresAt: Date;
}

/**
 * Calcula el monto según la configuración de la tarifa.
 *
 * Config 1 — "POR MINUTO CON LÍMITE DIARIO" (fields: price_per_minute, daily_limit)
 *   monto = minutos * price_per_minute, con tope daily_limit
 *
 * Config 2 — "TARIFA FIJA POR BLOQUE" (fields: block_duration_min, price_per_block)
 *   bloques = ceil(minutos / block_duration_min)
 *   monto   = bloques * price_per_block
 */
function calcularMontoVehicle(
    rate: VehicleRate,
    config: VehicleRateConfig,
    diffMinutes: number
): number {
    const fields = config.fields; // ej: "price_per_minute,daily_limit"

    if (fields.includes('price_per_minute')) {
        // CONFIG 1: por minuto con límite diario
        let amount = diffMinutes * (rate.price_per_minute || 0);
        
        if (rate.daily_limit && amount > rate.daily_limit) {
            amount = rate.daily_limit;
        }
        return amount;
    }

    if (fields.includes('price_per_block')) {
        // CONFIG 2: tarifa fija por bloque
        const blockDuration = rate.block_duration_min || 1;
        const blocks = Math.ceil(diffMinutes / blockDuration);
        return blocks * (rate.price_per_block || 0);
    }

    return 0;
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
     * Calcula el monto a pagar usando VehicleRate + VehicleRateConfig
     * según el tipo de vehículo y la fecha actual.
     */
    async calculateAmount(sessionId: number): Promise<number> {
        const session = await ParkingSession.findByPk(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        const vehicle = await Vehicle.findByPk(session.id_vehicles);
        if (!vehicle) {
            throw new Error(`Vehicle not found for session ${sessionId}`);
        }

        const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'

        // Buscar tarifa activa para el tipo de vehículo vigente hoy
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


        

        if (!rate) {
            throw new Error(
                `No active vehicle rate found for vehicle type ${vehicle.id_vehicle_types}`
            );
        }

        const config = rate.vehicleRateConfig;
        if (!config) {
            throw new Error(
                `VehicleRateConfig not found for rate ${rate.id_vehicle_rates}`
            );
        }

        // Calcular minutos transcurridos desde el ingreso
        const arrivalTime = new Date(session.arrival_time!);
        const now = new Date();
        const diffMs = now.getTime() - arrivalTime.getTime();
        const diffMinutes = Math.ceil(diffMs / 60000);

        const amount = calcularMontoVehicle(rate, config, diffMinutes);

        return Math.max(amount, 0);
    }

    /**
     * Genera un link de pago para una sesión de estacionamiento.
     * El método de pago es LINK (WhatsApp), code = 'LINK', id = 3 por defecto.
     */
    async createPaymentLink(
        licensePlate: string,
        sessionId: number
    ): Promise<PaymentLinkResult> {
        const baseUrl = process.env.APP_URL || 'http://localhost:3000';
        const amount = await this.calculateAmount(sessionId);

        // Crear orden en Klap
        const klapPayment = await this.klapService.createPayment({
            amount: amount,
            description: `Pago estacionamiento - ${licensePlate}`,
            licensePlate: licensePlate,
            userEmail: '',
        });

        // Buscar método de pago WhatsApp (code = 'LINK')
        const paymentMethod = await PaymentMethod.findOne({ where: { code: 'LINK' } });
        const paymentMethodId = paymentMethod?.id_payment_methods ?? 3;

        // Crear registro de pago
        const payment = await Payment.create({
            order_id: klapPayment.orderId,
            amount: amount,
            status: 'PENDING',
            created_at: new Date(),
            id_parking_sessions: sessionId,
            id_payment_methods: paymentMethodId,
        });

        // Crear link temporal (expira en 5 minutos)
        const linkCode = uuidv4();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await PaymentLink.create({
            order_id: klapPayment.orderId,
            reference_id: klapPayment.referenceId,
            link_code: linkCode,
            is_used: 0,
            expires_at: expiresAt,
            created_at: new Date(),
            id_payments: payment.id_payments,
        });

        const paymentUrl = `${baseUrl}/api/v1/payments/checkout?code=${linkCode}`;

        return {
            paymentUrl,
            amount,
            linkCode,
            expiresAt,
        };
    }

    /**
     * Genera un nuevo PaymentLink para una sesión existente.
     * Reutiliza el Payment PENDING de la sesión (no crea uno nuevo).
     * Crea una nueva orden en Klap con el monto recalculado.
     */
    async renewPaymentLink(
        licensePlate: string,
        sessionId: number
    ): Promise<PaymentLinkResult> {
        const baseUrl = process.env.APP_URL || 'http://localhost:3000';
        const amount = await this.calculateAmount(sessionId);

        // Buscar el Payment PENDING existente para esta sesión
        const existingPayment = await Payment.findOne({
            where: { id_parking_sessions: sessionId, status: 'PENDING' },
            order: [['created_at', 'DESC']]
        });

        if (!existingPayment) {
            throw new Error(`No pending payment found for session ${sessionId}`);
        }

        // Crear nueva orden en Klap con el monto actualizado
        const klapPayment = await this.klapService.createPayment({
            amount: amount,
            description: `Pago estacionamiento - ${licensePlate}`,
            licensePlate: licensePlate,
            userEmail: '',
        });

        // Crear nuevo link temporal (expira en 5 minutos)
        const linkCode = uuidv4();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await PaymentLink.create({
            order_id: klapPayment.orderId,
            reference_id: klapPayment.referenceId,
            link_code: linkCode,
            is_used: 0,
            expires_at: expiresAt,
            created_at: new Date(),
            id_payments: existingPayment.id_payments,
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
