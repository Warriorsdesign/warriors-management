export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { updateOrganizationSchema } from '@/lib/validation/organization';
import { organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET = withApiRoute(async (_req, { tx, orgId }) => {
  const [row] = await tx.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
  const organization = await findOrgScopedOrThrow(async () => row);
  return NextResponse.json(organization);
}, { permission: { resource: 'organization', action: 'read' } });

export const PATCH = withApiRoute(async (req, { tx, orgId }) => {
  const body = updateOrganizationSchema.parse(await req.json());
  const [row] = await tx.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
  const organization = await findOrgScopedOrThrow(async () => row);
  const [updated] = await tx.update(organizations).set(body).where(eq(organizations.id, organization.id)).returning();
  return NextResponse.json(updated);
}, { permission: { resource: 'organization', action: 'write' } });
