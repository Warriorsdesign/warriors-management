import { ApiError } from '@/lib/api/errors';
import type { Role } from './roles';

export function requireRole(roles: string[], allowed: readonly Role[]): void {
  if (!roles.some((r) => (allowed as readonly string[]).includes(r))) {
    throw new ApiError(403, 'Forbidden', 'INSUFFICIENT_ROLE');
  }
}
