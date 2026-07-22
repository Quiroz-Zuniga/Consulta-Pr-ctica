import type { NotificationLog } from '../../domain/entities/Notification.js';
import type { INotificationLogRepository } from '../../domain/ports/INotificationLogRepository.js';
import { supabaseAdmin } from './SupabaseClient.js';

export class PostgresNotificationLogRepository implements INotificationLogRepository {
  async save(log: NotificationLog): Promise<void> {
    const { error } = await supabaseAdmin.from('notifications_log').insert({
      id: log.id,
      appointment_id: log.appointmentId,
      channel: log.channel,
      status: log.status,
      sent_at: log.sentAt ? log.sentAt.toISOString() : null,
      error_message: log.errorMessage || null,
      created_at: log.createdAt.toISOString(),
    });

    if (error) {
      console.error(`Failed to insert notifications_log: ${error.message}`);
    }
  }

  async findByAppointmentId(appointmentId: string): Promise<NotificationLog[]> {
    const { data, error } = await supabaseAdmin
      .from('notifications_log')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      appointmentId: row.appointment_id,
      channel: row.channel,
      status: row.status,
      sentAt: row.sent_at ? new Date(row.sent_at) : undefined,
      errorMessage: row.error_message,
      createdAt: new Date(row.created_at),
    }));
  }
}
