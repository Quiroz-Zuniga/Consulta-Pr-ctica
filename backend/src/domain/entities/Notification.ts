import type { NotificationChannel } from '../ports/INotificationService.js';

export type NotificationStatus = 'pending' | 'sent' | 'failed';

export interface NotificationLog {
  id: string;
  appointmentId: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  sentAt?: Date;
  errorMessage?: string;
  createdAt: Date;
}
