import type { Appointment, AppointmentStatus, VideoSessionStatus, ConsultationType } from '../../domain/entities/Appointment.js';
import type { IAppointmentRepository, UpdateVideoSessionInput } from '../../domain/ports/IAppointmentRepository.js';
import { createScopedClient, supabaseAdmin } from './SupabaseClient.js';

export class PostgresAppointmentRepository implements IAppointmentRepository {
  async findById(id: string, token?: string): Promise<Appointment | null> {
    const client = token ? createScopedClient(token) : supabaseAdmin;
    const { data, error } = await client
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      if (error) console.error(`[findById ERROR] ${error.message}`);
      return null;
    }
    return this.mapToEntity(data);
  }

  async findUpcomingWithoutReminder(windowHours: number = 24): Promise<Appointment[]> {
    const now = new Date();
    const future = new Date(now.getTime() + windowHours * 60 * 60 * 1000);

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('status', 'scheduled')
      .eq('reminder_sent', false)
      .gte('appointment_date', now.toISOString())
      .lte('appointment_date', future.toISOString())
      .order('appointment_date', { ascending: true });

    if (error || !data) return [];
    return data.map((row: any) => this.mapToEntity(row));
  }

  async updateStatus(id: string, status: AppointmentStatus, token?: string): Promise<void> {
    const client = token ? createScopedClient(token) : supabaseAdmin;
    const { error } = await client
      .from('appointments')
      .update({ status })
      .eq('id', id);

    if (error) throw new Error(`Error al actualizar estado de la cita: ${error.message}`);
  }

  async updateReminderSent(id: string, sent: boolean): Promise<void> {
    const { error } = await supabaseAdmin
      .from('appointments')
      .update({ reminder_sent: sent })
      .eq('id', id);

    if (error) throw new Error(`Error al actualizar reminder_sent: ${error.message}`);
  }

  async updateVideoSession(id: string, data: UpdateVideoSessionInput, token?: string): Promise<void> {
    const client = token ? createScopedClient(token) : supabaseAdmin;
    const updatePayload: Record<string, any> = {
      video_room_name: data.videoRoomName,
      video_room_url: data.videoRoomUrl,
      video_session_status: data.videoSessionStatus,
    };
    if (data.consultationType) {
      updatePayload.consultation_type = data.consultationType;
    }

    const { error } = await client
      .from('appointments')
      .update(updatePayload)
      .eq('id', id);

    if (error) throw new Error(`Error al actualizar videoconsulta de la cita: ${error.message}`);
  }

  async save(appointment: Appointment, token?: string): Promise<void> {
    const client = token ? createScopedClient(token) : supabaseAdmin;
    const { error } = await client.from('appointments').insert({
      id: appointment.id,
      patient_id: appointment.patientId,
      doctor_id: appointment.doctorId || null,
      specialty: appointment.specialty || 'Medicina General',
      appointment_date: appointment.appointmentDate.toISOString(),
      reason: appointment.reason || null,
      status: appointment.status,
      reminder_sent: appointment.reminderSent ?? false,
      video_room_name: appointment.videoRoomName || null,
      video_room_url: appointment.videoRoomUrl || null,
      video_session_status: appointment.videoSessionStatus || 'not_created',
      consultation_type: appointment.consultationType || 'in_person',
    });

    if (error) throw new Error(`Error al guardar cita: ${error.message}`);
  }

  private mapToEntity(row: any): Appointment {
    return {
      id: row.id,
      patientId: row.patient_id,
      patientName: row.patient_name || row.patients?.full_name || 'Paciente',
      doctorId: row.doctor_id,
      doctorName: row.doctor_name,
      specialty: row.specialty,
      appointmentDate: new Date(row.appointment_date),
      reason: row.reason,
      status: row.status as AppointmentStatus,
      reminderSent: row.reminder_sent ?? false,
      videoRoomName: row.video_room_name || undefined,
      videoRoomUrl: row.video_room_url || undefined,
      videoSessionStatus: (row.video_session_status as VideoSessionStatus) || 'not_created',
      consultationType: (row.consultation_type as ConsultationType) || 'in_person',
      createdAt: new Date(row.created_at || Date.now()),
    };
  }
}
