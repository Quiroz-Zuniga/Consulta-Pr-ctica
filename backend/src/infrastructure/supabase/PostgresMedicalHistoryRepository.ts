import type { MedicalHistory } from '../../domain/entities/MedicalHistory.js';
import type { Prescription } from '../../domain/entities/Prescription.js';
import type { Medication } from '../../domain/entities/Medication.js';
import type { IMedicalHistoryRepository } from '../../domain/ports/IMedicalHistoryRepository.js';
import { supabaseAdmin } from './SupabaseClient.js';

export class PostgresMedicalHistoryRepository implements IMedicalHistoryRepository {
  async findById(id: string): Promise<MedicalHistory | null> {
    const { data, error } = await supabaseAdmin
      .from('medical_histories')
      .select(`
        *,
        prescriptions (
          *,
          prescription_items (*)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapToEntity(data);
  }

  async findByPatient(patientId: string): Promise<MedicalHistory[]> {
    const { data, error } = await supabaseAdmin
      .from('medical_histories')
      .select(`
        *,
        prescriptions (
          *,
          prescription_items (*)
        )
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(this.mapToEntity);
  }

  async save(history: MedicalHistory): Promise<void> {
    const { error: historyError } = await supabaseAdmin
      .from('medical_histories')
      .insert({
        id: history.id,
        patient_id: history.patientId,
        doctor_id: history.doctorId,
        cie10_code: history.cie10Code,
        clinical_note: history.clinicalNote,
        is_locked: history.isLocked,
      });

    if (historyError) {
      throw new Error(`Failed to save medical history: ${historyError.message}`);
    }

    if (history.prescription) {
      const { error: prescriptionError } = await supabaseAdmin
        .from('prescriptions')
        .insert({
          id: history.prescription.id,
          history_id: history.id,
          custom_indications: history.prescription.customIndications,
          next_appointment: history.prescription.nextAppointment?.toISOString().split('T')[0] ?? null,
        });

      if (prescriptionError) {
        throw new Error(`Failed to save prescription: ${prescriptionError.message}`);
      }

      if (history.prescription.medications.length > 0) {
        const items = history.prescription.medications.map((med) => ({
          prescription_id: history.prescription!.id,
          medication_name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration_days: med.durationDays,
        }));

        const { error: itemsError } = await supabaseAdmin
          .from('prescription_items')
          .insert(items);

        if (itemsError) {
          throw new Error(`Failed to save prescription items: ${itemsError.message}`);
        }
      }
    }
  }

  private mapToEntity(row: Record<string, unknown>): MedicalHistory {
    const prescriptions = (row.prescriptions as Record<string, unknown>[]) ?? [];
    const prescriptionRow = prescriptions.length > 0 ? prescriptions[0] : null;

    let prescription: Prescription | null = null;
    if (prescriptionRow) {
      const items = (prescriptionRow.prescription_items as Record<string, unknown>[]) ?? [];
      prescription = {
        id: prescriptionRow.id as string,
        historyId: row.id as string,
        medications: items.map((item) => ({
          name: item.medication_name as string,
          dosage: item.dosage as string,
          frequency: item.frequency as string,
          durationDays: item.duration_days as number,
        })),
        customIndications: (prescriptionRow.custom_indications as string) ?? '',
        nextAppointment: prescriptionRow.next_appointment
          ? new Date(prescriptionRow.next_appointment as string)
          : null,
        createdAt: new Date(prescriptionRow.created_at as string),
      };
    }

    return {
      id: row.id as string,
      patientId: row.patient_id as string,
      doctorId: row.doctor_id as string,
      cie10Code: row.cie10_code as string,
      clinicalNote: row.clinical_note as string,
      isLocked: row.is_locked as boolean,
      createdAt: new Date(row.created_at as string),
      prescription,
    };
  }
}
