import { randomBytes } from 'node:crypto';
import type { IntakeForm, IntakeFormStatus, IntakeClinicalData } from '../../domain/entities/IntakeForm.js';
import type { IIntakeFormRepository } from '../../domain/ports/IIntakeFormRepository.js';
import { supabaseAdmin } from './SupabaseClient.js';

export function generateSecureToken(bytes: number = 32): string {
  return randomBytes(bytes).toString('hex');
}

export class PostgresIntakeFormRepository implements IIntakeFormRepository {
  async create(form: IntakeForm): Promise<void> {
    const { error } = await supabaseAdmin.from('intake_forms').insert({
      id: form.id,
      patient_id: form.patientId,
      appointment_id: form.appointmentId || null,
      status: form.status,
      access_token: form.accessToken,
      token_expires_at: form.tokenExpiresAt.toISOString(),
      form_data: form.formData || null,
      submitted_at: form.submittedAt ? form.submittedAt.toISOString() : null,
      created_at: form.createdAt.toISOString(),
    });

    if (error) {
      throw new Error(`Failed to create intake form: ${error.message}`);
    }
  }

  async findByToken(token: string): Promise<IntakeForm | null> {
    const { data, error } = await supabaseAdmin
      .from('intake_forms')
      .select('*, patient:patients(full_name)')
      .eq('access_token', token)
      .single();

    if (error || !data) return null;
    return this.mapToEntity(data);
  }

  async findByPatientId(patientId: string): Promise<IntakeForm[]> {
    const { data, error } = await supabaseAdmin
      .from('intake_forms')
      .select('*, patient:patients(full_name)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map((row: any) => this.mapToEntity(row));
  }

  async markAsSubmitted(id: string, formData: IntakeClinicalData): Promise<void> {
    const now = new Date();
    const { error } = await supabaseAdmin
      .from('intake_forms')
      .update({
        status: 'submitted',
        form_data: formData,
        submitted_at: now.toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to mark intake form as submitted: ${error.message}`);
    }
  }

  async isTokenValid(token: string): Promise<boolean> {
    const form = await this.findByToken(token);
    if (!form) return false;
    if (form.status === 'submitted' || form.status === 'expired') return false;
    if (new Date() > new Date(form.tokenExpiresAt)) return false;
    return true;
  }

  private mapToEntity(row: any): IntakeForm {
    return {
      id: row.id,
      patientId: row.patient_id,
      patientName: row.patient_name || row.patient?.full_name || 'Paciente',
      appointmentId: row.appointment_id,
      status: row.status as IntakeFormStatus,
      accessToken: row.access_token,
      tokenExpiresAt: new Date(row.token_expires_at),
      submittedAt: row.submitted_at ? new Date(row.submitted_at) : undefined,
      formData: row.form_data || undefined,
      createdAt: new Date(row.created_at || Date.now()),
    };
  }
}
