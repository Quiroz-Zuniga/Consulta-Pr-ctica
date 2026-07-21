import type { FastifyInstance } from 'fastify';
import { CreateConsultationSchema } from '../../application/dtos/ConsultationDTO.js';
import { RegisterConsultation } from '../../application/use-cases/RegisterConsultation.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleGuard } from '../middlewares/roleGuard.js';

export function consultationRoutes(
  app: FastifyInstance,
  registerConsultation: RegisterConsultation,
): void {
  app.addHook('onRequest', authMiddleware);

  app.post('/api/v1/consultations', {
    preHandler: [roleGuard('ADMINISTRATOR', 'DOCTOR')],
  }, async (request, reply) => {
    const parsed = CreateConsultationSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400).send({ error: 'Datos inválidos', details: parsed.error.flatten() });
      return;
    }

    try {
      const result = await registerConsultation.execute(
        parsed.data,
        request.user!.id,
        request.user!.fullName,
      );
      reply.status(201).send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error interno';
      reply.status(500).send({ error: message });
    }
  });
}
