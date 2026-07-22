import type { IPaymentRepository, PatientPaymentSummary } from '../../domain/ports/IPaymentRepository.js';

export interface GetPatientPaymentsSummaryOutput {
  patientId: string;
  summary: PatientPaymentSummary;
  payments: Array<{
    id: string;
    appointmentId?: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    status: string;
    notes?: string;
    paidAt?: string;
    createdAt: string;
  }>;
}

export class GetPatientPaymentsSummary {
  constructor(private paymentRepository: IPaymentRepository) {}

  async execute(patientId: string): Promise<GetPatientPaymentsSummaryOutput> {
    const summary = await this.paymentRepository.getSummaryByPatient(patientId);
    const payments = await this.paymentRepository.findByPatientId(patientId);

    return {
      patientId,
      summary,
      payments: payments.map((p) => ({
        id: p.id,
        appointmentId: p.appointmentId,
        amount: p.amount,
        currency: p.currency,
        paymentMethod: p.paymentMethod,
        status: p.status,
        notes: p.notes,
        paidAt: p.paidAt?.toISOString(),
        createdAt: p.createdAt.toISOString(),
      })),
    };
  }
}
