import { NextResponse } from 'next/server';
import { withAdminRoute } from '@/lib/api/admin-handler';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import bcrypt from 'bcryptjs';

export const GET = withAdminRoute(async (req, { prisma, searchParams }) => {
  const search = searchParams.get('search')?.trim() || '';
  const status = searchParams.get('status') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)));

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status && status !== 'all') {
    where.status = status;
  }

  const [total, organizations] = await Promise.all([
    prisma.organization.count({ where }),
    prisma.organization.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: true,
        _count: {
          select: {
            centers: true,
            users: true,
            students: true,
            formations: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    organizations,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

export const POST = withAdminRoute(async (req, { prisma, adminUser }) => {
  const body = await req.json();
  const { name, email, phone, address, initialAdmin, plan = 'STARTER' } = body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json(
      { error: "Le nom de l'organisation est obligatoire." },
      { status: 400 }
    );
  }

  // Création au sein d'une transaction pour garantir la consistance
  const organization = await prisma.$transaction(async (tx) => {
    // 1. Création de l'organisation
    const org = await tx.organization.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        status: 'actif',
      },
    });

    // 2. Création de l'abonnement initial (Essai 30 jours par défaut)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    await tx.subscription.create({
      data: {
        organizationId: org.id,
        plan: plan,
        status: 'trial',
        startDate: new Date(),
        endDate,
        maxCenters: plan === 'ENTERPRISE' ? 10 : 3,
        maxStudents: plan === 'ENTERPRISE' ? 1000 : 200,
      },
    });

    // 3. Si un administrateur initial est fourni, on le crée
    if (initialAdmin && initialAdmin.email && initialAdmin.password) {
      const passwordHash = await bcrypt.hash(initialAdmin.password, 10);
      const matricule =
        initialAdmin.matricule?.trim().toUpperCase() ||
        `ADM-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      await tx.user.create({
        data: {
          organizationId: org.id,
          matricule,
          firstName: initialAdmin.firstName?.trim() || 'Admin',
          lastName: initialAdmin.lastName?.trim() || org.name,
          email: initialAdmin.email.trim().toLowerCase(),
          passwordHash,
          roles: ['ADMIN'],
          status: 'actif',
          isSuperAdmin: false,
        },
      });
    }

    return org;
  });

  // 4. Enregistrement dans l'Audit Log
  await logAuditEvent({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    actorName: 'Super Admin',
    action: 'ORGANIZATION_CREATED',
    resource: 'Organization',
    resourceId: organization.id,
    details: {
      name: organization.name,
      plan,
      hasInitialAdmin: !!initialAdmin,
    },
  });

  return NextResponse.json({ success: true, organization }, { status: 201 });
});
