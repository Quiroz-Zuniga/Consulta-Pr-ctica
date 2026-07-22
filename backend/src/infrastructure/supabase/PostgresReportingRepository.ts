import { supabaseAdmin } from './SupabaseClient.js';
import type {
  IReportingRepository,
  DateRange,
  AppointmentsStats,
  RevenueStats,
  TopDiagnosis,
  PatientVisitFrequency,
  ClinicReportData,
  PatientExpedientData,
} from '../../domain/ports/IReportingRepository.js';

export class PostgresReportingRepository implements IReportingRepository {
  // ─────────────────────────────────────────────────────────────
  // Expediente completo del paciente
  // ─────────────────────────────────────────────────────────────
  async getPatientExpedientData(patientId: string): Promise<PatientExpedientData> {
    const [
      patientRes,
      historiesRes,
      prescriptionsRes,
      intakeFormsRes,
      paymentsRes,
      appointmentsRes,
    ] = await Promise.all([
      supabaseAdmin.from('patients').select('*').eq('id', patientId).single(),
      supabaseAdmin
        .from('medical_histories')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('prescriptions')
        .select('*, prescription_items(*)')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('intake_forms')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('payments')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false }),
    ]);

    if (patientRes.error || !patientRes.data) {
      throw new Error(`Paciente con ID ${patientId} no encontrado`);
    }

    const p = patientRes.data as Record<string, unknown>;

    return {
      patient: {
        id: p.id as string,
        fullName: p.full_name as string,
        birthDate: p.birth_date ? new Date(p.birth_date as string) : undefined,
        gender: p.gender as string | undefined,
        phone: p.phone as string,
        photoUrl: p.photo_url as string | undefined,
        isProtected: Boolean(p.is_protected),
        createdAt: new Date(p.created_at as string),
      },
      medicalHistories: (historiesRes.data ?? []).map((h: Record<string, unknown>) => ({
        id: h.id as string,
        cie10Code: h.cie10_code as string | undefined,
        clinicalNote: h.clinical_note as string,
        isLocked: Boolean(h.is_locked),
        createdAt: new Date(h.created_at as string),
        doctorName: h.doctor_name as string | undefined,
      })),
      prescriptions: (prescriptionsRes.data ?? []).map((rx: Record<string, unknown>) => ({
        id: rx.id as string,
        historyId: rx.history_id as string,
        medications: ((rx.prescription_items as Record<string, unknown>[]) ?? []).map((item: Record<string, unknown>) => ({
          name: item.medication_name as string,
          dosage: item.dosage as string,
          frequency: item.frequency as string,
          durationDays: item.duration_days as number,
        })),
        customIndications: rx.custom_indications as string | undefined,
        nextAppointment: rx.next_appointment ? new Date(rx.next_appointment as string) : null,
        createdAt: new Date(rx.created_at as string),
      })),
      intakeForms: (intakeFormsRes.data ?? []).map((f: Record<string, unknown>) => ({
        id: f.id as string,
        status: f.status as string,
        chiefComplaint: f.chief_complaint as string | undefined,
        symptoms: f.symptoms as string | undefined,
        allergies: f.allergies as string | undefined,
        currentMedications: f.current_medications as string | undefined,
        medicalBackground: f.medical_background as string | undefined,
        createdAt: new Date(f.created_at as string),
        submittedAt: f.submitted_at ? new Date(f.submitted_at as string) : undefined,
      })),
      payments: (paymentsRes.data ?? []).map((pay: Record<string, unknown>) => ({
        id: pay.id as string,
        amount: pay.amount as number,
        currency: pay.currency as string,
        paymentMethod: pay.payment_method as string,
        status: pay.status as string,
        notes: pay.notes as string | undefined,
        paidAt: pay.paid_at ? new Date(pay.paid_at as string) : undefined,
        createdAt: new Date(pay.created_at as string),
      })),
      appointments: (appointmentsRes.data ?? []).map((apt: Record<string, unknown>) => ({
        id: apt.id as string,
        appointmentDate: new Date(apt.appointment_date as string),
        status: apt.status as string,
        doctorName: apt.doctor_name as string | undefined,
        notes: apt.notes as string | undefined,
        createdAt: new Date(apt.created_at as string),
      })),
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Estadísticas agregadas del consultorio
  // ─────────────────────────────────────────────────────────────
  async getAppointmentsStats(dateRange: DateRange): Promise<AppointmentsStats> {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select('status')
      .gte('appointment_date', dateRange.from.toISOString())
      .lte('appointment_date', dateRange.to.toISOString());

    if (error) throw new Error(`getAppointmentsStats failed: ${error.message}`);
    const rows = data ?? [];
    const total = rows.length;
    const completed = rows.filter((r) => r.status === 'completed').length;
    const cancelled = rows.filter((r) => r.status === 'cancelled').length;
    const scheduled = rows.filter((r) => r.status === 'scheduled').length;
    const noShows = rows.filter((r) => r.status === 'no_show').length;

    return {
      total,
      completed,
      cancelled,
      scheduled,
      noShows,
      noShowRate: total > 0 ? Math.round((noShows / total) * 100) : 0,
    };
  }

  async getRevenueStats(dateRange: DateRange): Promise<RevenueStats> {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('amount, currency, payment_method, status')
      .gte('created_at', dateRange.from.toISOString())
      .lte('created_at', dateRange.to.toISOString());

    if (error) throw new Error(`getRevenueStats failed: ${error.message}`);
    const rows = data ?? [];

    const totalRevenue = rows.reduce((sum, r) => sum + Number(r.amount), 0);
    const totalPaid = rows.filter((r) => r.status === 'paid').reduce((sum, r) => sum + Number(r.amount), 0);
    const totalPending = rows.filter((r) => r.status === 'pending').reduce((sum, r) => sum + Number(r.amount), 0);
    const totalRefunded = rows.filter((r) => r.status === 'refunded').reduce((sum, r) => sum + Number(r.amount), 0);

    const methodMap = new Map<string, { amount: number; count: number }>();
    for (const r of rows) {
      const existing = methodMap.get(r.payment_method) ?? { amount: 0, count: 0 };
      methodMap.set(r.payment_method, {
        amount: existing.amount + Number(r.amount),
        count: existing.count + 1,
      });
    }

    return {
      totalRevenue,
      totalPaid,
      totalPending,
      totalRefunded,
      currency: rows[0]?.currency ?? 'HNL',
      byMethod: Array.from(methodMap.entries()).map(([method, stats]) => ({
        method,
        amount: stats.amount,
        count: stats.count,
      })),
    };
  }

  async getNoShowRate(dateRange: DateRange): Promise<number> {
    const stats = await this.getAppointmentsStats(dateRange);
    return stats.noShowRate;
  }

  async getTopDiagnoses(dateRange: DateRange, limit = 10): Promise<TopDiagnosis[]> {
    const { data, error } = await supabaseAdmin
      .from('medical_histories')
      .select('cie10_code')
      .gte('created_at', dateRange.from.toISOString())
      .lte('created_at', dateRange.to.toISOString())
      .not('cie10_code', 'is', null);

    if (error) throw new Error(`getTopDiagnoses failed: ${error.message}`);
    const rows = data ?? [];

    const codeCount = new Map<string, number>();
    for (const r of rows) {
      const code = r.cie10_code as string;
      codeCount.set(code, (codeCount.get(code) ?? 0) + 1);
    }

    const sorted = Array.from(codeCount.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);

    // Enrich with descriptions from cie10_diagnoses table
    const codes = sorted.map(([code]) => code);
    const { data: diagData } = await supabaseAdmin
      .from('cie10_diagnoses')
      .select('code, description')
      .in('code', codes);

    const descMap = new Map((diagData ?? []).map((d: { code: string; description: string }) => [d.code, d.description]));

    return sorted.map(([code, count]) => ({
      code,
      description: descMap.get(code) ?? code,
      count,
    }));
  }

  async getPatientVisitFrequency(dateRange: DateRange, limit = 20): Promise<PatientVisitFrequency[]> {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select('patient_id, patient_name, appointment_date')
      .gte('appointment_date', dateRange.from.toISOString())
      .lte('appointment_date', dateRange.to.toISOString())
      .eq('status', 'completed');

    if (error) throw new Error(`getPatientVisitFrequency failed: ${error.message}`);
    const rows = data ?? [];

    const visitMap = new Map<string, { patientName: string; count: number; lastVisit: Date }>();
    for (const r of rows) {
      const existing = visitMap.get(r.patient_id);
      const aptDate = new Date(r.appointment_date as string);
      if (!existing) {
        visitMap.set(r.patient_id, { patientName: r.patient_name ?? 'N/A', count: 1, lastVisit: aptDate });
      } else {
        existing.count++;
        if (aptDate > existing.lastVisit) existing.lastVisit = aptDate;
      }
    }

    return Array.from(visitMap.entries())
      .map(([patientId, stats]) => ({
        patientId,
        patientName: stats.patientName,
        visitCount: stats.count,
        lastVisit: stats.lastVisit,
      }))
      .sort((a, b) => b.visitCount - a.visitCount)
      .slice(0, limit);
  }

  async getClinicReport(dateRange: DateRange): Promise<ClinicReportData> {
    const [appointments, revenue, topDiagnoses, patientVisitFrequency] = await Promise.all([
      this.getAppointmentsStats(dateRange),
      this.getRevenueStats(dateRange),
      this.getTopDiagnoses(dateRange, 10),
      this.getPatientVisitFrequency(dateRange, 20),
    ]);

    // Count new patients in period
    const { count: newPatientsCount } = await supabaseAdmin
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', dateRange.from.toISOString())
      .lte('created_at', dateRange.to.toISOString());

    // Count unique patients with appointments in period
    const { data: uniquePatientsData } = await supabaseAdmin
      .from('appointments')
      .select('patient_id')
      .gte('appointment_date', dateRange.from.toISOString())
      .lte('appointment_date', dateRange.to.toISOString());

    const uniquePatients = new Set((uniquePatientsData ?? []).map((r) => r.patient_id)).size;

    return {
      dateRange,
      generatedAt: new Date(),
      appointments,
      revenue,
      topDiagnoses,
      patientVisitFrequency,
      totalPatients: uniquePatients,
      newPatients: newPatientsCount ?? 0,
    };
  }
}
