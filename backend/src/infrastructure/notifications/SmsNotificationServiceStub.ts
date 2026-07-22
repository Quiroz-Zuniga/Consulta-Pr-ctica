import type {
  INotificationService,
  NotificationChannel,
  NotificationPayload,
  NotificationSendResult,
} from '../../domain/ports/INotificationService.js';

export class SmsNotificationServiceStub implements INotificationService {
  async send(
    channel: NotificationChannel,
    payload: NotificationPayload,
    appointmentId: string,
  ): Promise<NotificationSendResult> {
    console.log(`[STUB SMS] Recordatorio SMS para cita ${appointmentId} a ${payload.to}`);
    return {
      success: true,
      messageId: `stub_sms_${Date.now()}_${appointmentId}`,
    };
  }
}
