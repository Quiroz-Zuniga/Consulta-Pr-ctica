import { z } from 'zod';
import type { IPaymentRepository } from '../../domain/ports/IPaymentRepository.js';
import type { PaymentStatus } from '../../domain/entities/Payment.js';

export const UpdatePaymentStatusSchema = z.object({
  paymentId: z.string().uuid('ID de pago inválido'),
  status: z.enum(['pending', 'paid', 'partial', 'refunded'], {
    errorMap: () => ({ message: 'Estado de pago inválido ( pending, paid, partial, refunded )' }),
  }),
});

export type UpdatePaymentStatusInput = z.infer<typeof UpdatePaymentStatusSchema>;

export interface UpdatePaymentStatusOutput {
  paymentId: string;
  status: PaymentStatus;
  paidAt?: string;
}

export class UpdatePaymentStatus {
  constructor(private paymentRepository: IPaymentRepository) {}

  async execute(input: UpdatePaymentStatusInput): Promise<UpdatePaymentStatusOutput> {
    const validated = UpdatePaymentStatusSchema.parse(input);

    const payment = await this.paymentRepository.findById(validated.paymentId);
    if (!payment) {
      throw new Error(`Pago con ID ${validated.paymentId} no encontrado.`);
    }

    const paidAt = validated.status === 'paid' ? new Date() : payment.paidAt;

    await this.paymentRepository.updateStatus(
      validated.paymentId,
      validated.status as PaymentStatus,
      paidAt,
    );

    return {
      paymentId: validated.paymentId,
      status: validated.status as PaymentStatus,
      paidAt: paidAt?.toISOString(),
    };
  }
}
