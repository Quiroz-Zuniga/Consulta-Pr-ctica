import cron from 'node-cron';
import type { ScheduleUpcomingReminders } from '../../application/use-cases/ScheduleUpcomingReminders.js';

export function startReminderCronJob(scheduleUpcomingReminders: ScheduleUpcomingReminders) {
  // Ejecutar cada hora al minuto 0 ('0 * * * *')
  const task = cron.schedule('0 * * * *', async () => {
    console.log('[CRON JOB] Iniciando verificación de recordatorios de citas próximas (ventana +24h)...');
    try {
      const summary = await scheduleUpcomingReminders.execute(24);
      console.log(
        `[CRON JOB COMPLETADO] Procesadas: ${summary.processed} | Enviados: ${summary.sent} | Fallidos: ${summary.failed}`,
      );
    } catch (err: any) {
      console.error('[CRON JOB ERROR] Fallo al ejecutar recordatorios automáticos:', err);
    }
  });

  console.log('[CRON JOB INITIALIZED] Recordatorios de citas programados para correr cada hora (0 * * * *).');
  return task;
}
