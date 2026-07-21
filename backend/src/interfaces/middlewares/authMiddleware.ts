import type { FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin } from '../../infrastructure/supabase/SupabaseClient.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'ADMINISTRATOR' | 'DOCTOR' | 'RECEPTIONIST';
  fullName: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Token no proporcionado' });
    return;
  }

  const token = authHeader.slice(7);

  const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !authUser) {
    reply.status(401).send({ error: 'Token inválido o expirado' });
    return;
  }

  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, email, role, full_name, is_active')
    .eq('id', authUser.id)
    .single();

  if (userError || !userData) {
    reply.status(401).send({ error: 'Usuario no encontrado en el sistema' });
    return;
  }

  if (!userData.is_active) {
    reply.status(401).send({ error: 'Usuario inactivo' });
    return;
  }

  request.user = {
    id: userData.id as string,
    email: userData.email as string,
    role: userData.role as AuthenticatedUser['role'],
    fullName: userData.full_name as string,
  };
}
