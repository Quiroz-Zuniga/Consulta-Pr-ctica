/**
 * Puerto para pasarelas de pago online (ej. PayPal, Stripe, etc.)
 * Preparado para expansión futura.
 */
export interface IPaymentGatewayRequest {
  amount: number;
  currency: string;
  description: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface IPaymentGatewayResponse {
  transactionId: string;
  approvalUrl?: string;
  status: 'created' | 'approved' | 'failed';
}

export interface IPaymentGatewayService {
  processOnlinePayment?(request: IPaymentGatewayRequest): Promise<IPaymentGatewayResponse>;
  refundPayment?(transactionId: string, amount?: number): Promise<boolean>;
}
