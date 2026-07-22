import { randomUUID } from 'node:crypto';
import type { IAppointmentRepository } from '../../domain/ports/IAppointmentRepository.js';
import type { IPatientRepository } from '../../domain/ports/IPatientRepository.js';
import type { INotificationService, NotificationChannel } from '../../domain/ports/INotificationService.js';
import type { INotificationLogRepository } from '../../domain/ports/INotificationLogRepository.js';
import type { NotificationLog } from '../../domain/entities/Notification.js';

export interface SendReminderResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class SendAppointmentReminder {
  constructor(
    private readonly appointmentRepo: IAppointmentRepository,
    private readonly patientRepo: IPatientRepository,
    private readonly notificationService: INotificationService,
    private readonly notificationLogRepo: INotificationLogRepository,
  ) {}

  async execute(
    appointmentId: string,
    channel: NotificationChannel = 'whatsapp',
    userToken?: string,
  ): Promise<SendReminderResult> {
    if (!appointmentId) {
      throw new Error('El ID de la cita es obligatorio.');
    }

    const appointment = await this.appointmentRepo.findById(appointmentId, userToken);
    if (!appointment) {
      throw new Error(`Cita con ID ${appointmentId} no encontrada.`);
    }

    const patient = await this.patientRepo.findById(appointment.patientId, userToken);
    const targetPhone = patient?.phone || '';
    const patientName = patient?.fullName || appointment.patientName || 'Paciente';

    const aptDate = new Date(appointment.appointmentDate);
    const dateStr = aptDate.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeStr = aptDate.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const sendResult = await this.notificationService.send(
      channel,
      {
        to: targetPhone,
        patientName,
        appointmentDate: dateStr,
        appointmentTime: timeStr,
        doctorName: appointment.doctorName,
      },
      appointmentId,
    );

    const now = new Date();
    const log: NotificationLog = {
      id: randomUUID(),
      appointmentId,
      channel,
      status: sendResult.success ? 'sent' : 'failed',
      sentAt: sendResult.success ? now : undefined,
      errorMessage: sendResult.error,
      createdAt: now,
    };

    await this.notificationLogRepo.save(log);

    if (sendResult.success) {
      // Marcar reminder_sent = true solo si el envío fue exitoso
      await this.appointmentRepo.updateReminderSent(appointmentId, true);
    } else {
      console.warn(
        `[RECORDATORIO FALLIDO] Cita ${appointmentId}: ${sendResult.error}. reminder_sent permanece en FALSE para reintento.`,
      );
    }

    return sendResult;
  }
}
