export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { organizations, subscriptions, plans, users, centers, students, formations } from '@/lib/db/schema';
import { and, eq, ilike, or, desc, count, asc } from 'drizzle-orm';
import { withAdminRoute } from '@/lib/api/admin-handler';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import bcrypt from 'bcryptjs';
import { ensureOrgSystemRoles } from '@/lib/auth/permissions';

export const GET = withAdminRoute(async (_req, { searchParams }) => {
  const search = searchParams.get('search')?.trim() || '';
  const status = searchParams.get('status') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)));
  const filters = [];
  if (search) filters.push(or(ilike(organizations.name, `%${search}%`), ilike(organizations.email, `%${search}%`))!);
  if (status && status !== 'all') filters.push(eq(organizations.status, status));
  const where = filters.length ? and(...filters) : undefined;
  const [totalRow] = await db.select({ value: count() }).from(organizations).where(where);
  const rows = await db.select({ organization: organizations, subscription: subscriptions }).from(organizations)
    .leftJoin(subscriptions, eq(subscriptions.organizationId, organizations.id))
    .where(where).orderBy(desc(organizations.createdAt)).limit(pageSize).offset((page - 1) * pageSize);
  const organizationRows = await Promise.all(rows.map(async ({ organization, subscription }) => {
    const [centerCount] = await db.select({ value: count() }).from(centers).where(eq(centers.organizationId, organization.id));
    const [userCount] = await db.select({ value: count() }).from(users).where(eq(users.organizationId, organization.id));
    const [studentCount] = await db.select({ value: count() }).from(students).where(eq(students.organizationId, organization.id));
    const [formationCount] = await db.select({ value: count() }).from(formations).where(eq(formations.organizationId, organization.id));
    return { ...organization, subscription, _count: { centers: Number(centerCount?.value ?? 0), users: Number(userCount?.value ?? 0), students: Number(studentCount?.value ?? 0), formations: Number(formationCount?.value ?? 0) } };
  }));
  const total = Number(totalRow?.value ?? 0);
  return NextResponse.json({ organizations: organizationRows, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
});

export const POST = withAdminRoute(async (req, { adminUser }) => {
  const body = await req.json();
  const { name, email, phone, address, initialAdmin, plan } = body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: "Le nom de l'organisation est obligatoire." }, { status: 400 });
  }
  const organization = await db.transaction(async (tx) => {
    const [org] = await tx.insert(organizations).values({ name: name.trim(), email: email?.trim() || null, phone: phone?.trim() || null, address: address?.trim() || null, status: 'actif' }).returning();
    await ensureOrgSystemRoles(tx as never, org.id);
    const endDate = new Date(); endDate.setDate(endDate.getDate() + 30);
    const selectedRows = plan ? await tx.select().from(plans).where(or(eq(plans.id, plan), eq(plans.name, plan))).limit(1) : [];
    let selectedPlan = selectedRows[0];
    if (!selectedPlan) [selectedPlan] = await tx.select().from(plans).where(eq(plans.price, 0)).orderBy(asc(plans.createdAt)).limit(1);
    if (!selectedPlan) throw new Error('Aucun forfait disponible pour créer cet abonnement.');
    await tx.insert(subscriptions).values({ organizationId: org.id, planId: selectedPlan.id, status: 'trial', startDate: new Date(), endDate, maxCenters: selectedPlan.isUnlimitedCenters ? -1 : selectedPlan.maxCenters, maxStudents: selectedPlan.isUnlimitedStudents ? -1 : selectedPlan.maxStudents });
    if (initialAdmin && initialAdmin.email && initialAdmin.password) {
      const passwordHash = await bcrypt.hash(initialAdmin.password, 10);
      const matricule = initialAdmin.matricule?.trim().toUpperCase() || `WM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      await tx.insert(users).values({ organizationId: org.id, matricule, firstName: initialAdmin.firstName?.trim() || 'Admin', lastName: initialAdmin.lastName?.trim() || org.name, email: initialAdmin.email.trim().toLowerCase(), passwordHash, mustChangePassword: true, roles: ['ADMIN'], status: 'actif', isSuperAdmin: false });
    }
    return org;
  });
  await logAuditEvent({ actorId: adminUser.id, actorEmail: adminUser.email, actorName: 'Super Admin', action: 'ORGANIZATION_CREATED', resource: 'Organization', resourceId: organization.id, details: { name: organization.name, plan, hasInitialAdmin: !!initialAdmin } });
  return NextResponse.json({ success: true, organization }, { status: 201 });
});
