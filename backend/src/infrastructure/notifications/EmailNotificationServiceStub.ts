import type {
  INotificationService,
  NotificationChannel,
  NotificationPayload,
  NotificationSendResult,
} from '../../domain/ports/INotificationService.js';

export class EmailNotificationServiceStub implements INotificationService {
  async send(
    channel: NotificationChannel,
    payload: NotificationPayload,
    appointmentId: string,
  ): Promise<NotificationSendResult> {
    console.log(`[STUB EMAIL] Recordatorio Email para cita ${appointmentId} a ${payload.to}`);
    return {
      success: true,
      messageId: `stub_email_${Date.now()}_${appointmentId}`,
    };
  }
}
