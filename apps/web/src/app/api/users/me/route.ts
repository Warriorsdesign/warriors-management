import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { updateOwnProfileSchema } from '@/lib/validation/users';
import { users } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export const PATCH = withApiRoute(async (req, { tx, orgId, userId }) => {
  const body = updateOwnProfileSchema.parse(await req.json());
  const [selfRow] = await tx.select().from(users).where(and(eq(users.id, userId), eq(users.organizationId, orgId))).limit(1);
  const self = await findOrgScopedOrThrow(async () => selfRow);
  const [updated] = await tx.update(users).set(body).where(eq(users.id, self.id)).returning({
      id: users.id, matricule: users.matricule, firstName: users.firstName, lastName: users.lastName, email: users.email,
      roles: users.roles, status: users.status, avatarUrl: users.avatarUrl,
  });
  return NextResponse.json(updated);
});
