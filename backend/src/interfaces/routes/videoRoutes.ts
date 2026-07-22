import type { FastifyInstance } from 'fastify';
import type { CreateVideoConsultation } from '../../application/use-cases/CreateVideoConsultation.js';
import type { GetVideoConsultationLink } from '../../application/use-cases/GetVideoConsultationLink.js';
import type { GetIntakeFormByToken } from '../../application/use-cases/GetIntakeFormByToken.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleGuard } from '../middlewares/roleGuard.js';

export function videoRoutes(
  fastify: FastifyInstance,
  createVideoConsultation: CreateVideoConsultation,
  getVideoConsultationLink: GetVideoConsultationLink,
  getIntakeFormByToken: GetIntakeFormByToken,
) {
  // ---------------------------------------------------------------------------
  // RUTA PÚBLICA (SIN authMiddleware, protegida mediante token seguro de preconsulta/cita)
  // ---------------------------------------------------------------------------
  fastify.get(
    '/api/v1/public/appointments/:id/video-consultation',
    {
      config: {
        rateLimit: {
          max: 30,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { token } = request.query as { token?: string };

      if (!token) {
        return reply.status(401).send({ error: 'Acceso denegado: Token de verificación de cita requerido.' });
      }

      // Validar token de acceso seguro
      const intakeData = await getIntakeFormByToken.execute(token);
      if (!intakeData || (!intakeData.isValid && intakeData.reasonForInvalidity !== 'already_submitted')) {
        return reply.status(403).send({ error: 'Acceso denegado: Token de cita inválido o expirado.' });
      }

      try {
        const videoData = await getVideoConsultationLink.execute(id);
        return reply.status(200).send(videoData);
      } catch (err: any) {
        return reply.status(400).send({ error: err.message });
      }
    },
  );

  // ---------------------------------------------------------------------------
  // RUTAS INTERNAS (AUTENTICADAS con authMiddleware + roleGuard)
  // ---------------------------------------------------------------------------
  fastify.register(async function internalVideoRoutes(app) {
    app.addHook('onRequest', authMiddleware);

    // POST /api/v1/appointments/:id/video-consultation — Crear o reusar sala de videoconsulta
    app.post(
      '/api/v1/appointments/:id/video-consultation',
      { preHandler: [roleGuard('ADMINISTRATOR', 'DOCTOR', 'RECEPTIONIST')] },
      async (request, reply) => {
        const { id } = request.params as { id: string };

        try {
          const result = await createVideoConsultation.execute(id, request.user?.token);
          return reply.status(201).send(result);
        } catch (err: any) {
          return reply.status(400).send({ error: err.message });
        }
      },
    );

    // GET /api/v1/appointments/:id/video-consultation — Obtener datos de videoconsulta
    app.get(
      '/api/v1/appointments/:id/video-consultation',
      { preHandler: [roleGuard('ADMINISTRATOR', 'DOCTOR', 'RECEPTIONIST')] },
      async (request, reply) => {
        const { id } = request.params as { id: string };

        try {
          const result = await getVideoConsultationLink.execute(id, request.user?.token);
          return reply.status(200).send(result);
        } catch (err: any) {
          return reply.status(400).send({ error: err.message });
        }
      },
    );
  });
}
