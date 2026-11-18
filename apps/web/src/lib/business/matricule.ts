import { randomBytes } from 'crypto';
import { ApiError } from '@/lib/api/errors';
import type { TenantClient } from '@/lib/db';
import { adminPrisma } from '@/lib/db/admin';

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
 * Variante en lot de generateStudentMatricule pour l'import : même format, unicité garantie
 * en mémoire contre `taken` (matricules existants de l'organisation, complété au fil de
 * l'eau) sans requête par étudiant. Le format n'offre que 10 000 matricules par an et par
 * organisation : au-delà, l'import échoue explicitement.
 */
export function generateStudentMatriculesBatch(taken: Set<string>, count: number, year = new Date().getFullYear()): string[] {
  const prefix = `WM${year}`;
  const free: string[] = [];
  for (let n = 0; n < 10000; n++) {
    const candidate = `${prefix}${String(n).padStart(4, '0')}`;
    if (!taken.has(candidate)) free.push(candidate);
  }
  if (free.length < count) {
    throw new ApiError(
      409,
      `Impossible de générer ${count} matricules : il ne reste que ${free.length} matricules disponibles pour ${year}. Renseignez la colonne Matricule.`,
      'MATRICULE_EXHAUSTED'
    );
  }
  // Tirage aléatoire parmi les numéros libres (Fisher-Yates partiel), comme la génération unitaire.
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (free.length - i));
    [free[i], free[j]] = [free[j], free[i]];
  }
  const result = free.slice(0, count);
  result.forEach((m) => taken.add(m));
  return result;
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
 * donc par `adminPrisma` plutôt que par `tx`, qui est cantonné à l'organisation courante par la RLS.
 */
export async function generateUserMatricule(orgName: string): Promise<string> {
  const now = new Date();
  const yymm = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prefix = `${organizationCode(orgName)}${yymm}`;

  const existingCount = await adminPrisma.user.count({ where: { matricule: { startsWith: prefix } } });

  for (let i = 0; i < 20; i++) {
    const seq = String(existingCount + 1 + i).padStart(3, '0');
    const candidate = `${prefix}${seq}`;
    const exists = await adminPrisma.user.findUnique({ where: { matricule: candidate } });
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
