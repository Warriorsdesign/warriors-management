import { randomBytes } from 'crypto';
import { ApiError } from '@/lib/api/errors';
import type { TenantClient } from '@/lib/db';
import { authPrisma } from '@/lib/db/auth-client';

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

function organizationCode(orgName: string): string {
  const letters = orgName
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // retire les accents
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase();
  return (letters + 'XXXX').slice(0, 4);
}

/**
 * Format {4 lettres de l'org}{AAMM}{séquence sur 3 chiffres}, ex: DINS2609007.
 * Sert désormais d'identifiant de connexion (voir /api/auth/login) : le login se fait
 * AVANT de connaître l'organisation, donc User.matricule doit être unique sur TOUTE la
 * base, pas seulement au sein d'une org. Le comptage/la vérification d'unicité passe
 * donc par `authPrisma` (rôle app_auth, visibilité globale sur User - voir auth-client.ts)
 * plutôt que par `tx`, qui est cantonné à l'organisation courante par la RLS.
 */
export async function generateUserMatricule(orgName: string): Promise<string> {
  const now = new Date();
  const yymm = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prefix = `${organizationCode(orgName)}${yymm}`;

  const existingCount = await authPrisma.user.count({ where: { matricule: { startsWith: prefix } } });

  for (let i = 0; i < 20; i++) {
    const seq = String(existingCount + 1 + i).padStart(3, '0');
    const candidate = `${prefix}${seq}`;
    const exists = await authPrisma.user.findUnique({ where: { matricule: candidate } });
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
