import { NextResponse } from 'next/server';
import { and, count, eq, gte, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';

/**
 * Limite des tentatives de connexion (essais de mots de passe en rafale). Les échecs sont tracés
 * dans le journal d'audit (action LOGIN_FAILED, visible dans le back-office) :
 * - 5 échecs sur un même identifiant en 15 minutes bloquent cet identifiant 15 minutes ;
 * - 20 échecs depuis une même connexion (IP) en 15 minutes la bloquent, tous identifiants confondus.
 * Une connexion réussie remet le compteur de l'identifiant à zéro.
 */
const WINDOW_MS = 15 * 60 * 1000;
export const MAX_FAILURES_PER_ACCOUNT = 5;
export const MAX_FAILURES_PER_IP = 20;
const ACTION = 'LOGIN_FAILED';

export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return (forwarded?.split(',')[0] ?? request.headers.get('x-real-ip') ?? '').trim();
}

/** Réponse 429 si l'identifiant ou l'IP a trop d'échecs récents, sinon null. */
export async function loginThrottleResponse(identifier: string, ip: string, lastSuccessAt?: Date | null) {
  const windowStart = new Date(Date.now() - WINDOW_MS);
  const accountSince = lastSuccessAt && lastSuccessAt > windowStart ? lastSuccessAt : windowStart;
  const [accountFailures, ipFailures] = await Promise.all([
    db.select({ count: count() }).from(auditLogs).where(and(
      eq(auditLogs.action, ACTION),
      gte(auditLogs.createdAt, accountSince),
      sql`${auditLogs.details}->>'identifier' = ${identifier}`,
    )).then(([row]) => row?.count ?? 0),
    ip
      ? db.select({ count: count() }).from(auditLogs).where(and(
          eq(auditLogs.action, ACTION),
          gte(auditLogs.createdAt, windowStart),
          sql`${auditLogs.details}->>'ip' = ${ip}`,
        )).then(([row]) => row?.count ?? 0)
      : Promise.resolve(0),
  ]);
  if (accountFailures < MAX_FAILURES_PER_ACCOUNT && ipFailures < MAX_FAILURES_PER_IP) return null;
  return NextResponse.json(
    {
      error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes, ou demandez à votre administrateur de réinitialiser votre mot de passe.',
      code: 'LOGIN_RATE_LIMIT',
    },
    { status: 429, headers: { 'Retry-After': String(WINDOW_MS / 1000) } }
  );
}

export async function recordLoginFailure(identifier: string, ip: string, userId?: string) {
  await db.insert(auditLogs).values({
        actorId: userId ?? 'anonymous',
        actorEmail: identifier,
        actorName: 'Tentative de connexion',
        action: ACTION,
        resource: 'Security',
        resourceId: userId ?? null,
        details: { identifier, ip },
      })
    .catch(() => undefined);
}
