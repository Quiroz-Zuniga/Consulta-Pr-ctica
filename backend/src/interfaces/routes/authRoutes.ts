import type { FastifyInstance } from 'fastify';
import { LoginRequestSchema } from '../../application/dtos/AuthDTO.js';
import { AuthenticateUser } from '../../application/use-cases/AuthenticateUser.js';

export function authRoutes(
  app: FastifyInstance,
  authenticateUser: AuthenticateUser,
): void {
  app.post('/api/v1/auth/login', async (request, reply) => {
    const parsed = LoginRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400).send({ error: 'Datos inválidos', details: parsed.error.flatten() });
      return;
    }

    try {
      const result = await authenticateUser.execute(parsed.data);
      reply.status(200).send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error interno';
      reply.status(401).send({ error: message });
    }
  });
}
