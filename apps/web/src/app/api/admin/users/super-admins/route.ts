import { NextResponse } from 'next/server';
import { withAdminRoute } from '@/lib/api/admin-handler';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import bcrypt from 'bcryptjs';

export const POST = withAdminRoute(async (req, { prisma, adminUser }) => {
  const body = await req.json();
  const { firstName, lastName, email, matricule, password } = body;

  if (!firstName || !lastName || !email || !password) {
    return NextResponse.json(
      { error: 'Prénom, nom, email et mot de passe sont obligatoires.' },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Vérifier l'unicité de l'email
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: 'Un utilisateur avec cet email existe déjà.' },
      { status: 409 }
    );
  }

  const generatedMatricule =
    matricule?.trim().toUpperCase() ||
    `SA-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const passwordHash = await bcrypt.hash(password, 10);

  const newSuperAdmin = await prisma.user.create({
    data: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      matricule: generatedMatricule,
      passwordHash,
      isSuperAdmin: true,
      roles: ['SUPER_ADMIN'],
      organizationId: null,
      status: 'actif',
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      matricule: true,
      isSuperAdmin: true,
      createdAt: true,
    },
  });

  await logAuditEvent({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    actorName: 'Super Admin',
    action: 'SUPER_ADMIN_CREATED',
    resource: 'User',
    resourceId: newSuperAdmin.id,
    details: {
      email: newSuperAdmin.email,
      name: `${newSuperAdmin.firstName} ${newSuperAdmin.lastName}`,
    },
  });

  return NextResponse.json(
    {
      success: true,
      user: newSuperAdmin,
      message: 'Compte Super Administrateur créé avec succès.',
    },
    { status: 201 }
  );
});
