export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow, assertOrgCenters, assertOrgRoles } from '@/lib/db/scoped';
import { createUserSchema } from '@/lib/validation/users';
import { assertCanAssignRoles } from '@/lib/auth/permissions';
import { generateUserMatricule, generateRandomPassword } from '@/lib/business/matricule';
import { users, organizations, centerUsers, centers } from '@/lib/db/schema';
import { and, eq, ilike, or, asc } from 'drizzle-orm';

export const GET = withApiRoute(async (req, { tx, orgId, userId, scope, searchParams }) => {
  const search = searchParams.get('search')?.trim();
  const filters = [eq(users.organizationId, orgId)];
  if (search) filters.push(or(ilike(users.firstName, `%${search}%`), ilike(users.lastName, `%${search}%`), ilike(users.email, `%${search}%`), ilike(users.matricule, `%${search}%`))!);
  const rows = await tx.select().from(users).where(and(...filters)).orderBy(asc(users.firstName));
  const usersData = await Promise.all(rows.map(async (user) => {
    const links = await tx.select({ id: centers.id, name: centers.name }).from(centerUsers).innerJoin(centers, eq(centers.id, centerUsers.centerId)).where(eq(centerUsers.userId, user.id));
    const visible = scope.centerIds === null ? links : links.filter((center) => scope.centerIds!.includes(center.id));
    if (scope.centerIds !== null && user.id !== userId && visible.length === 0) return null;
    return { id: user.id, matricule: user.matricule, firstName: user.firstName, lastName: user.lastName, email: user.email, roles: user.roles, status: user.status, avatarUrl: user.avatarUrl, centers: visible };
  }));
  const filteredUsers = usersData.filter((user): user is NonNullable<typeof user> => user !== null);
  return NextResponse.json({ data: filteredUsers });
}, { permission: { resource: 'users', action: 'read' } });

export const POST = withApiRoute(async (req, { tx, orgId, scope, perms }) => {
  const body = createUserSchema.parse(await req.json());
  await assertOrgRoles(tx, orgId, body.roles);
  await assertCanAssignRoles(tx, orgId, perms, body.roles);
  await assertOrgCenters(tx, orgId, body.centerIds);
  scope.assertAssignableCenters(body.centerIds);

  const [orgRow] = await tx.select({ name: organizations.name }).from(organizations).where(eq(organizations.id, orgId)).limit(1);
  const organization = await findOrgScopedOrThrow(async () => orgRow);
  const matricule = await generateUserMatricule(organization.name);
  const provisionalPassword = generateRandomPassword();
  const passwordHash = await bcrypt.hash(provisionalPassword, 10);

  const [user] = await tx.insert(users).values({
      firstName: body.firstName, lastName: body.lastName, email: body.email, roles: body.roles,
      status: body.status, matricule, passwordHash, mustChangePassword: true, organizationId: orgId,
    }).returning({ id: users.id, matricule: users.matricule, firstName: users.firstName, lastName: users.lastName, email: users.email, roles: users.roles, status: users.status, avatarUrl: users.avatarUrl });
    await Promise.all(body.centerIds.map((centerId) => tx.insert(centerUsers).values({ centerId, userId: user.id })));

  return NextResponse.json({ user, provisionalPassword }, { status: 201 });
}, { permission: { resource: 'users', action: 'write' } });
