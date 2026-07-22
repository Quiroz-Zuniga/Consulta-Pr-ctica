import type { IPaymentRepository } from '../../domain/ports/IPaymentRepository.js';
import type { Payment } from '../../domain/entities/Payment.js';

export interface GetPaymentsByAppointmentOutput {
  appointmentId: string;
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    status: string;
    notes?: string;
    paidAt?: string;
    createdAt: string;
  }>;
  totalPaid: number;
  totalPending: number;
  overallStatus: 'unpaid' | 'partial' | 'paid' | 'refunded';
}

export class GetPaymentsByAppointment {
  constructor(private paymentRepository: IPaymentRepository) {}

  async execute(appointmentId: string): Promise<GetPaymentsByAppointmentOutput> {
    const payments = await this.paymentRepository.findByAppointmentId(appointmentId);

    let totalPaid = 0;
    let totalPending = 0;

    for (const p of payments) {
      if (p.status === 'paid') {
        totalPaid += p.amount;
      } else if (p.status === 'pending' || p.status === 'partial') {
        totalPending += p.amount;
      }
    }

    let overallStatus: 'unpaid' | 'partial' | 'paid' | 'refunded' = 'unpaid';
    if (payments.length > 0) {
      const allPaid = payments.every((p) => p.status === 'paid');
      const allRefunded = payments.every((p) => p.status === 'refunded');
      const hasPaid = payments.some((p) => p.status === 'paid' || p.status === 'partial');

      if (allPaid) overallStatus = 'paid';
      else if (allRefunded) overallStatus = 'refunded';
      else if (hasPaid) overallStatus = 'partial';
      else overallStatus = 'unpaid';
    }

    return {
      appointmentId,
      payments: payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        paymentMethod: p.paymentMethod,
        status: p.status,
        notes: p.notes,
        paidAt: p.paidAt?.toISOString(),
        createdAt: p.createdAt.toISOString(),
      })),
      totalPaid,
      totalPending,
      overallStatus,
    };
  }
}
