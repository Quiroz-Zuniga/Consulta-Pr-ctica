import type { IAuthService, AuthResult } from '../../domain/ports/IAuthService.js';
import type { User } from '../../domain/entities/User.js';
import { supabaseAdmin } from './SupabaseClient.js';

export class SupabaseAuthService implements IAuthService {
  async signIn(email: string, password: string): Promise<AuthResult> {
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.session) {
      throw new Error('Credenciales inválidas');
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      throw new Error('Usuario no encontrado en el sistema');
    }

    if (!userData.is_active) {
      throw new Error('Usuario inactivo');
    }

    const user: Omit<User, 'passwordHash'> = {
      id: userData.id as string,
      email: userData.email as string,
      fullName: userData.full_name as string,
      role: userData.role as User['role'],
      isActive: userData.is_active as boolean,
      createdAt: new Date(userData.created_at as string),
    };

    return {
      accessToken: authData.session.access_token,
      user,
      expiresAt: authData.session.expires_at ?? 0,
    };
  }

  async verifyToken(token: string): Promise<{ id: string; email: string } | null> {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return null;
    return { id: user.id, email: user.email ?? '' };
  }
}
