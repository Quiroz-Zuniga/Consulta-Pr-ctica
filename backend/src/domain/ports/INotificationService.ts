export type NotificationChannel = 'whatsapp' | 'sms' | 'email';

export interface NotificationPayload {
  to: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  doctorName?: string;
  customMessage?: string;
}

export interface NotificationSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface INotificationService {
  send(
    channel: NotificationChannel,
    payload: NotificationPayload,
    appointmentId: string,
  ): Promise<NotificationSendResult>;
}
