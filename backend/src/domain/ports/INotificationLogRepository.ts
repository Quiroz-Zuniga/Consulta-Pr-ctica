import type { NotificationLog } from '../entities/Notification.js';

export interface INotificationLogRepository {
  save(log: NotificationLog): Promise<void>;
  findByAppointmentId(appointmentId: string): Promise<NotificationLog[]>;
}
