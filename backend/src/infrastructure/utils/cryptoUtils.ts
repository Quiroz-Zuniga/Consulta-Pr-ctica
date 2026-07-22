import { randomBytes } from 'node:crypto';

export function generateSecureToken(bytes: number = 32): string {
  return randomBytes(bytes).toString('hex');
}
