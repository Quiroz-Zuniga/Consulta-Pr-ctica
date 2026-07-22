import type { PatientExpedientData } from '../../domain/ports/IReportingRepository.js';

interface CsvJsonExportResult {
  csv: string;
  json: string;
}

/**
 * Exporta los datos de un paciente a formato CSV y JSON portables.
 * No depende de ningún puerto de dominio — opera sobre el DTO ya construido.
 */
export class CsvJsonExportService {
  exportPatientData(data: PatientExpedientData): CsvJsonExportResult {
    return {
      csv: this.buildCsv(data),
      json: JSON.stringify(this.buildJsonExport(data), null, 2),
    };
  }

  // ─────────────────────────────────────────────────────────────
  // CSV multi-sección (separado por cabeceras de sección)
  // ─────────────────────────────────────────────────────────────
  private buildCsv(data: PatientExpedientData): string {
    const lines: string[] = [];
    const esc = (v: string | number | boolean | undefined | null): string => {
      if (v == null) return '';
      const s = String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    // PACIENTE
    lines.push('=== DATOS DEL PACIENTE ===');
    lines.push('id,full_name,birth_date,gender,phone,is_protected,created_at');
    lines.push([
      esc(data.patient.id),
      esc(data.patient.fullName),
      esc(data.patient.birthDate?.toISOString()),
      esc(data.patient.gender),
      esc(data.patient.phone),
      esc(String(data.patient.isProtected)),
      esc(data.patient.createdAt.toISOString()),
    ].join(','));

    lines.push('');

    // HISTORIAL MÉDICO
    lines.push('=== HISTORIAL MÉDICO ===');
    lines.push('id,cie10_code,clinical_note,is_locked,doctor_name,created_at');
    for (const h of data.medicalHistories) {
      lines.push([
        esc(h.id), esc(h.cie10Code), esc(h.clinicalNote),
        esc(String(h.isLocked)), esc(h.doctorName), esc(h.createdAt.toISOString()),
      ].join(','));
    }

    lines.push('');

    // RECETAS
    lines.push('=== RECETAS ===');
    lines.push('prescription_id,medication_name,dosage,frequency,duration_days,custom_indications,created_at');
    for (const rx of data.prescriptions) {
      for (const med of rx.medications) {
        lines.push([
          esc(rx.id), esc(med.name), esc(med.dosage),
          esc(med.frequency), esc(med.durationDays),
          esc(rx.customIndications), esc(rx.createdAt.toISOString()),
        ].join(','));
      }
    }

    lines.push('');

    // PAGOS
    lines.push('=== PAGOS ===');
    lines.push('id,amount,currency,payment_method,status,notes,paid_at,created_at');
    for (const pay of data.payments) {
      lines.push([
        esc(pay.id), esc(pay.amount), esc(pay.currency),
        esc(pay.paymentMethod), esc(pay.status), esc(pay.notes),
        esc(pay.paidAt?.toISOString()), esc(pay.createdAt.toISOString()),
      ].join(','));
    }

    lines.push('');

    // CITAS
    lines.push('=== CITAS ===');
    lines.push('id,appointment_date,status,doctor_name,created_at');
    for (const apt of data.appointments) {
      lines.push([
        esc(apt.id), esc(apt.appointmentDate.toISOString()),
        esc(apt.status), esc(apt.doctorName), esc(apt.createdAt.toISOString()),
      ].join(','));
    }

    return lines.join('\n');
  }

  // ─────────────────────────────────────────────────────────────
  // JSON con estructura completa y metadatos de exportación
  // ─────────────────────────────────────────────────────────────
  private buildJsonExport(data: PatientExpedientData): Record<string, unknown> {
    return {
      _meta: {
        exportedAt: new Date().toISOString(),
        system: 'Consulta Práctica Web',
        format: 'patient_expedient_v1',
        isProtected: data.patient.isProtected,
      },
      patient: data.patient,
      medicalHistories: data.medicalHistories,
      prescriptions: data.prescriptions,
      intakeForms: data.intakeForms,
      payments: data.payments,
      appointments: data.appointments,
    };
  }
}
