import { z } from 'zod';
import type { User } from '../../domain/entities/User.js';

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginRequestDTO = z.infer<typeof LoginRequestSchema>;

export interface LoginResponseDTO {
  accessToken: string;
  user: Omit<User, 'passwordHash'>;
  expiresAt: number;
}
