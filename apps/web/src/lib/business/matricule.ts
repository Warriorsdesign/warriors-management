import { randomBytes } from 'crypto';
import { ApiError } from '@/lib/api/errors';
import type { TenantClient } from '@/lib/db';

function randomMatriculeSuffix(): string {
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0');
}

/** Format WM{année}{4 chiffres}, retry sur collision (matricule+organizationId est unique). */
export async function generateStudentMatricule(tx: TenantClient, orgId: string): Promise<string> {
  const year = new Date().getFullYear();
  for (let i = 0; i < 5; i++) {
    const candidate = `WM${year}${randomMatriculeSuffix()}`;
    const exists = await tx.student.findUnique({
      where: { matricule_organizationId: { matricule: candidate, organizationId: orgId } },
    });
    if (!exists) return candidate;
  }
  throw new ApiError(500, 'Failed to generate a unique student matricule');
}

/**
 * Format WM{année}{4 chiffres}. Contrairement à Student, User.matricule n'a pas de
 * contrainte d'unicité en base (schéma existant) - vérification best-effort seulement.
 */
export async function generateUserMatricule(tx: TenantClient, orgId: string): Promise<string> {
  const year = new Date().getFullYear();
  for (let i = 0; i < 5; i++) {
    const candidate = `WM${year}${randomMatriculeSuffix()}`;
    const exists = await tx.user.findFirst({ where: { matricule: candidate, organizationId: orgId } });
    if (!exists) return candidate;
  }
  throw new ApiError(500, 'Failed to generate a unique user matricule');
}

const PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

export function generateRandomPassword(length = 10): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += PASSWORD_CHARS[bytes[i] % PASSWORD_CHARS.length];
  }
  return out;
}
