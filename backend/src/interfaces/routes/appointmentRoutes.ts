import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { SendAppointmentReminder } from '../../application/use-cases/SendAppointmentReminder.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleGuard } from '../middlewares/roleGuard.js';
import type { NotificationChannel } from '../../domain/ports/INotificationService.js';

const sendReminderBodySchema = z.object({
  channel: z.enum(['whatsapp', 'sms', 'email']).optional().default('whatsapp'),
});

export function appointmentRoutes(
  fastify: FastifyInstance,
  sendAppointmentReminder: SendAppointmentReminder,
) {
  fastify.register(async function authenticated(scopedApp) {
    scopedApp.addHook('onRequest', authMiddleware);

    // POST /api/v1/appointments/:id/send-reminder — Disparo manual de recordatorio (Recepción, Médico, Admin)
    scopedApp.post(
      '/api/v1/appointments/:id/send-reminder',
    { preHandler: [roleGuard('ADMINISTRATOR', 'DOCTOR', 'RECEPTIONIST')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = sendReminderBodySchema.parse(request.body || {});

      try {
        const result = await sendAppointmentReminder.execute(
          id,
          body.channel as NotificationChannel,
          request.user?.token,
        );

        if (!result.success) {
          return reply.status(400).send({
            error: result.error || 'No se pudo enviar el recordatorio de la cita.',
            success: false,
          });
        }

        return reply.status(200).send({
          success: true,
          message: 'Recordatorio enviado exitosamente.',
          messageId: result.messageId,
        });
      } catch (err: any) {
        return reply.status(500).send({
          error: err.message || 'Error interno al enviar recordatorio',
          success: false,
        });
      }
    },
  );
  });
}
