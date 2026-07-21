import type { User } from '../entities/User.js';

export interface AuthResult {
  accessToken: string;
  user: Omit<User, 'passwordHash'>;
  expiresAt: number;
}

export interface IAuthService {
  signIn(email: string, password: string): Promise<AuthResult>;
  verifyToken(token: string): Promise<{ id: string; email: string } | null>;
}
