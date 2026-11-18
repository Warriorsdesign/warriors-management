import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow, assertOrgCenters, assertOrgRoles } from '@/lib/db/scoped';
import { createUserSchema } from '@/lib/validation/users';
import { assertCanAssignRoles } from '@/lib/auth/permissions';
import { generateUserMatricule, generateRandomPassword } from '@/lib/business/matricule';

export const GET = withApiRoute(async (req, { tx, orgId, userId, scope, searchParams }) => {
  const search = searchParams.get('search')?.trim();
  const users = await tx.user.findMany({
    where: {
      organizationId: orgId,
      ...scope.user(userId),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { matricule: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    select: {
      id: true, matricule: true, firstName: true, lastName: true, email: true,
      roles: true, status: true, avatarUrl: true,
      // Les centres hors périmètre d'un collègue multi-centres ne sont pas révélés.
      centers: { where: scope.center(), select: { id: true, name: true } },
    },
    orderBy: { firstName: 'asc' },
  });
  return NextResponse.json({ data: users });
}, { permission: { resource: 'users', action: 'read' } });

export const POST = withApiRoute(async (req, { tx, orgId, scope, perms }) => {
  const body = createUserSchema.parse(await req.json());
  await assertOrgRoles(tx, orgId, body.roles);
  await assertCanAssignRoles(tx, orgId, perms, body.roles);
  await assertOrgCenters(tx, orgId, body.centerIds);
  scope.assertAssignableCenters(body.centerIds);

  const organization = await findOrgScopedOrThrow(() =>
    tx.organization.findFirst({ where: { id: orgId }, select: { name: true } })
  );
  const matricule = await generateUserMatricule(organization.name);
  const provisionalPassword = generateRandomPassword();
  const passwordHash = await bcrypt.hash(provisionalPassword, 10);

  const user = await tx.user.create({
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      roles: body.roles,
      status: body.status,
      matricule,
      passwordHash,
      mustChangePassword: true, // mot de passe provisoire : changement exigé à la première connexion
      organizationId: orgId,
      centers: { connect: body.centerIds.map((id) => ({ id })) },
    },
    select: {
      id: true, matricule: true, firstName: true, lastName: true, email: true,
      roles: true, status: true, avatarUrl: true,
    },
  });

  return NextResponse.json({ user, provisionalPassword }, { status: 201 });
}, { permission: { resource: 'users', action: 'write' } });
