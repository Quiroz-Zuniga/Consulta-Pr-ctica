import type { Payment, PaymentStatus } from '../entities/Payment.js';

export interface PatientPaymentSummary {
  totalPaid: number;
  totalPending: number;
  totalRefunded: number;
  count: number;
}

export interface IPaymentRepository {
  create(payment: Payment): Promise<void>;
  findById(id: string): Promise<Payment | null>;
  findByAppointmentId(appointmentId: string): Promise<Payment[]>;
  findByPatientId(patientId: string): Promise<Payment[]>;
  updateStatus(id: string, status: PaymentStatus, paidAt?: Date): Promise<void>;
  getSummaryByPatient(patientId: string): Promise<PatientPaymentSummary>;
}
