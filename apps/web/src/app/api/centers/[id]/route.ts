export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { ApiError } from '@/lib/api/errors';
import { assertCenterNameAvailable } from '@/lib/business/centers';
import { ROLES } from '@/lib/auth/roles';
import { updateCenterSchema } from '@/lib/validation/centers';
import { centers, classGroups, expenses } from '@/lib/db/schema';
import { and, eq, count } from 'drizzle-orm';

type Params = { id: string };

export const GET = withApiRoute<Params>(async (_req, { tx, orgId, scope, params }) => {
  const [center] = await tx.select().from(centers).where(and(eq(centers.id, params.id), eq(centers.organizationId, orgId))).limit(1);
  const found = await findOrgScopedOrThrow(async () => center);
  scope.assertCenter(found.id);
  return NextResponse.json(found);
}, { permission: { resource: 'centers', action: 'read' } });

// Les centres structurent le périmètre d'accès des utilisateurs : seuls les administrateurs
// de l'organisation peuvent les créer, les modifier ou les supprimer.
export const PATCH = withApiRoute<Params>(async (req, { tx, orgId, params }) => {
  const body = updateCenterSchema.parse(await req.json());
  const [row] = await tx.select().from(centers).where(and(eq(centers.id, params.id), eq(centers.organizationId, orgId))).limit(1);
  const center = await findOrgScopedOrThrow(async () => row);
  if (body.name !== undefined) await assertCenterNameAvailable(tx, orgId, body.name, center.id);
  const [updated] = await tx.update(centers).set(body).where(eq(centers.id, center.id)).returning();
  return NextResponse.json(updated);
}, { allowedRoles: [ROLES.ADMIN], permission: { resource: 'centers', action: 'write' } });

export const DELETE = withApiRoute<Params>(async (_req, { tx, orgId, params }) => {
  const [row] = await tx.select().from(centers).where(and(eq(centers.id, params.id), eq(centers.organizationId, orgId))).limit(1);
  const center = await findOrgScopedOrThrow(async () => row);
  // La suppression d'un centre emporterait ses classes (donc leurs étudiants et paiements) et ses dépenses.
  const [classRow] = await tx.select({ value: count() }).from(classGroups).where(eq(classGroups.centerId, center.id));
  const [expenseRow] = await tx.select({ value: count() }).from(expenses).where(eq(expenses.centerId, center.id));
  const classes = Number(classRow?.value ?? 0);
  const expensesCount = Number(expenseRow?.value ?? 0);
  if (classes > 0 || expensesCount > 0) {
    const what = [classes > 0 ? `${classes} classe(s)` : '', expensesCount > 0 ? `${expensesCount} dépense(s)` : ''].filter(Boolean).join(' et ');
    throw new ApiError(409, `Ce centre a encore ${what} : le supprimer effacerait ces données. Passez-le plutôt en inactif.`, 'CENTER_HAS_DATA');
  }
  await tx.delete(centers).where(eq(centers.id, center.id));
  return NextResponse.json({ success: true });
}, { allowedRoles: [ROLES.ADMIN], permission: { resource: 'centers', action: 'write' } });
