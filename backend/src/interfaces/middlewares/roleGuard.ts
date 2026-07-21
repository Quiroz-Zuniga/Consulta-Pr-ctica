import type { FastifyRequest, FastifyReply } from 'fastify';
import type { AuthenticatedUser } from './authMiddleware.js';

export function roleGuard(...allowedRoles: AuthenticatedUser['role'][]) {
  return async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!request.user) {
      reply.status(401).send({ error: 'No autenticado' });
      return;
    }

    if (!allowedRoles.includes(request.user.role)) {
      reply.status(403).send({ error: 'No tienes permisos para acceder a este recurso' });
      return;
    }
  };
}
