import type { FastifyInstance } from 'fastify';
import { SearchCIE10Schema } from '../../application/dtos/CIE10DTO.js';
import { SearchCIE10 } from '../../application/use-cases/SearchCIE10.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleGuard } from '../middlewares/roleGuard.js';

export function cie10Routes(
  app: FastifyInstance,
  searchCIE10: SearchCIE10,
): void {
  app.register(async function authenticated(scopedApp) {
    scopedApp.addHook('onRequest', authMiddleware);

    scopedApp.get('/api/v1/cie10/search', {
      preHandler: [roleGuard('ADMINISTRATOR', 'DOCTOR')],
    }, async (request, reply) => {
      const parsed = SearchCIE10Schema.safeParse(request.query);
      if (!parsed.success) {
        reply.status(400).send({ error: 'Parámetro de búsqueda requerido', details: parsed.error.flatten() });
        return;
      }

      try {
        const results = await searchCIE10.execute(parsed.data.q, request.user?.token);
        reply.status(200).send(results);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error interno';
        reply.status(500).send({ error: message });
      }
    });
  });
}
