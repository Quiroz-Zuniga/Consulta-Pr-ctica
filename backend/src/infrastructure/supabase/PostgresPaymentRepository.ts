import { supabaseAdmin } from './SupabaseClient.js';
import type { Payment, PaymentStatus, PaymentMethod } from '../../domain/entities/Payment.js';
import type { IPaymentRepository, PatientPaymentSummary } from '../../domain/ports/IPaymentRepository.js';

export class PostgresPaymentRepository implements IPaymentRepository {
  async create(payment: Payment): Promise<void> {
    const { error } = await supabaseAdmin.from('payments').insert({
      id: payment.id,
      appointment_id: payment.appointmentId || null,
      patient_id: payment.patientId,
      amount: payment.amount,
      currency: payment.currency || 'HNL',
      payment_method: payment.paymentMethod,
      status: payment.status,
      notes: payment.notes || null,
      registered_by: payment.registeredBy || null,
      paid_at: payment.paidAt ? payment.paidAt.toISOString() : null,
      created_at: payment.createdAt.toISOString(),
    });

    if (error) {
      console.error('[PostgresPaymentRepository.create ERROR]', error);
      throw new Error(`Failed to create payment: ${error.message}`);
    }
  }

  async findById(id: string): Promise<Payment | null> {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[PostgresPaymentRepository.findById ERROR]', error);
      throw new Error(`Failed to find payment by id: ${error.message}`);
    }

    if (!data) return null;
    return this.mapToDomain(data);
  }

  async findByAppointmentId(appointmentId: string): Promise<Payment[]> {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[PostgresPaymentRepository.findByAppointmentId ERROR]', error);
      throw new Error(`Failed to find payments for appointment: ${error.message}`);
    }

    return (data || []).map((row) => this.mapToDomain(row));
  }

  async findByPatientId(patientId: string): Promise<Payment[]> {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[PostgresPaymentRepository.findByPatientId ERROR]', error);
      throw new Error(`Failed to find payments for patient: ${error.message}`);
    }

    return (data || []).map((row) => this.mapToDomain(row));
  }

  async updateStatus(id: string, status: PaymentStatus, paidAt?: Date): Promise<void> {
    const updatePayload: any = {
      status,
    };
    if (paidAt) {
      updatePayload.paid_at = paidAt.toISOString();
    }

    const { error } = await supabaseAdmin
      .from('payments')
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      console.error('[PostgresPaymentRepository.updateStatus ERROR]', error);
      throw new Error(`Failed to update payment status: ${error.message}`);
    }
  }

  async getSummaryByPatient(patientId: string): Promise<PatientPaymentSummary> {
    const payments = await this.findByPatientId(patientId);

    let totalPaid = 0;
    let totalPending = 0;
    let totalRefunded = 0;

    for (const p of payments) {
      if (p.status === 'paid') {
        totalPaid += p.amount;
      } else if (p.status === 'pending' || p.status === 'partial') {
        totalPending += p.amount;
      } else if (p.status === 'refunded') {
        totalRefunded += p.amount;
      }
    }

    return {
      totalPaid,
      totalPending,
      totalRefunded,
      count: payments.length,
    };
  }

  private mapToDomain(row: any): Payment {
    return {
      id: row.id,
      appointmentId: row.appointment_id || undefined,
      patientId: row.patient_id,
      amount: Number(row.amount),
      currency: row.currency || 'HNL',
      paymentMethod: row.payment_method as PaymentMethod,
      status: row.status as PaymentStatus,
      notes: row.notes || undefined,
      registeredBy: row.registered_by || undefined,
      paidAt: row.paid_at ? new Date(row.paid_at) : undefined,
      createdAt: new Date(row.created_at),
    };
  }
}
