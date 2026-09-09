import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { withApiRoute } from '@/lib/api/handler';
import { PERMISSIONS } from '@/lib/auth/roles';
import { createUserSchema } from '@/lib/validation/users';
import { generateUserMatricule, generateRandomPassword } from '@/lib/business/matricule';

export const GET = withApiRoute(async (req, { tx, orgId, searchParams }) => {
  const search = searchParams.get('search')?.trim();
  const users = await tx.user.findMany({
    where: {
      organizationId: orgId,
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
      centers: { select: { id: true, name: true } },
    },
    orderBy: { firstName: 'asc' },
  });
  return NextResponse.json({ data: users });
}, { allowedRoles: PERMISSIONS.users.read });

export const POST = withApiRoute(async (req, { tx, orgId }) => {
  const body = createUserSchema.parse(await req.json());

  const matricule = await generateUserMatricule(tx, orgId);
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
      organizationId: orgId,
      centers: { connect: body.centerIds.map((id) => ({ id })) },
    },
    select: {
      id: true, matricule: true, firstName: true, lastName: true, email: true,
      roles: true, status: true, avatarUrl: true,
    },
  });

  return NextResponse.json({ user, provisionalPassword }, { status: 201 });
}, { allowedRoles: PERMISSIONS.users.write });
