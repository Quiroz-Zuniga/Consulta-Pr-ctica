import type { IAppointmentRepository } from '../../domain/ports/IAppointmentRepository.js';
import type { SendAppointmentReminder } from './SendAppointmentReminder.js';

export interface ScheduleRemindersResult {
  processed: number;
  sent: number;
  failed: number;
}

export class ScheduleUpcomingReminders {
  constructor(
    private readonly appointmentRepo: IAppointmentRepository,
    private readonly sendReminderUseCase: SendAppointmentReminder,
  ) {}

  async execute(windowHours: number = 24): Promise<ScheduleRemindersResult> {
    const upcomingAppointments = await this.appointmentRepo.findUpcomingWithoutReminder(windowHours);

    let sentCount = 0;
    let failedCount = 0;

    for (const appointment of upcomingAppointments) {
      try {
        const result = await this.sendReminderUseCase.execute(appointment.id, 'whatsapp');
        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
        }
      } catch (err: any) {
        console.error(`Error al procesar recordatorio automático para cita ${appointment.id}:`, err);
        failedCount++;
      }
    }

    return {
      processed: upcomingAppointments.length,
      sent: sentCount,
      failed: failedCount,
    };
  }
}
