import axios, { AxiosInstance } from 'axios';
import { Logger } from '../../shared/utils/logger';
import { PaymentError } from '../../shared/errors/AppError';

export interface CreatePaymentRequest {
  amount: number;
  description: string;
  licensePlate: string;
  userEmail?: string;
}

export interface PaymentResponse {
  orderId: string;
  referenceId: string;
  paymentUrl: string;
  status: string;
}

/**
 * Servicio de integración con Klap Payment Gateway
 */
export class KlapService {
  private client: AxiosInstance;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('KlapService');

    this.client = axios.create({
      baseURL: process.env.KLAP_API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Apikey': process.env.KLAP_API_KEY,
      },
    });
  }

  /**
   * Crea una orden de pago en Klap
   */
  async createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    try {
      const referenceId = this.generateReferenceId();

      const orderData = {
        reference_id: referenceId,
        description: request.description,
        methods: ['tarjetas'],
        amount: {
          currency: 'CLP',
          total: Math.round(request.amount),
        },
        user: {
          email: request.userEmail || 'cliente@revia.cl',
        },
        urls: {
          return_url: `${process.env.APP_URL}/api/v1/payment/success`,
          cancel_url: `${process.env.APP_URL}/api/v1/payment/cancel`,
        },
        webhooks: {
          webhook_confirm: `${process.env.APP_URL}/api/v1/webhooks/klap/confirm`,
          webhook_reject: `${process.env.APP_URL}/api/v1/webhooks/klap/reject`,
        },
        customs: [
          // Tiempo de expiración (30 minutos)
          { key: 'tarjetas_expiration_minutes', value: '30' },

          // Notificaciones
          { key: 'notify_payment_user', value: 'true' },
          { key: 'notify_payment_merchant', value: 'true' },
          { key: 'notify_payment_email_merchant', value: process.env.MERCHANT_EMAIL || 'josh.yzxt@gmail.com' },

          // Pago sin cuotas (pago único)
          //  { key: 'tarjetas_quotas_allowed', value: '1' },

          // Tipo de entrega - 4 = Productos no físicos (digital)
          { key: 'tarjetas_delivery_type', value: '4' }
        ],
      };

      this.logger.info('Creating Klap order', { referenceId });

      const response = await this.client.post('/orders', orderData);

      this.logger.info('Klap order created', {
        orderId: response.data.order_id,
        referenceId: response.data.reference_id
      });

      return {
        orderId: response.data.order_id,
        referenceId: response.data.reference_id,
        paymentUrl: response.data.redirect_url, // Campo correcto según OpenAPI spec
        status: response.data.status,
      };


    } catch (error: any) {
      this.logger.error('Failed to create payment', { error: error.message });
      throw new PaymentError(
        'No se pudo crear la orden de pago',
        error.response?.data
      );
    }
  }

  /**
   * Valida webhook de Klap
   */
  validateWebhook(apiKey: string): boolean {
    return apiKey === process.env.KLAP_API_KEY;
  }

  /**
   * Genera reference_id único
   */
  private generateReferenceId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `ORDER-${timestamp}-${random}`;
  }
}
