import type { TenantClient } from '@/lib/db';
import { ApiError } from '@/lib/api/errors';

/** Nom comparable : sans accents, sans casse, espaces réduits ("Centre  Akwa" = "centre akwa"). */
export function normalizeCenterName(name: string): string {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Sérialise les créations de centres d'une même organisation jusqu'à la fin de la transaction :
 * un double clic ou deux onglets ne peuvent ni créer deux fois le même centre, ni dépasser le
 * quota du forfait en passant les contrôles en même temps.
 */
export async function lockCenterCreation(tx: TenantClient, orgId: string): Promise<void> {
  await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))', `center-create:${orgId}`);
}

/** Refuse un nom de centre déjà utilisé dans l'organisation (excludeId : centre renommé). */
export async function assertCenterNameAvailable(tx: TenantClient, orgId: string, name: string, excludeId?: string): Promise<void> {
  const target = normalizeCenterName(name);
  const centers = await tx.center.findMany({ where: { organizationId: orgId }, select: { id: true, name: true } });
  const clash = centers.find((c) => c.id !== excludeId && normalizeCenterName(c.name) === target);
  if (clash) {
    throw new ApiError(409, `Un centre porte déjà ce nom (« ${clash.name} »). Choisissez un autre nom.`, 'CENTER_NAME_TAKEN');
  }
}
