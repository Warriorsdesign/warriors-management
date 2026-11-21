export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { withLiveStatus } from '@/lib/business/paymentSchedule';
import { assertClassHasRoom, isActiveStatus } from '@/lib/business/classStatus';
import { assertStudentQuota } from '@/lib/business/studentQuota';
import { createStudentSchema } from '@/lib/validation/students';
import { generateStudentMatricule } from '@/lib/business/matricule';
import { buildInitialSchedule, rebuildScheduleForStudent } from '@/lib/business/paymentSchedule';
import { ApiError } from '@/lib/api/errors';
import { parseCenterIds } from '@/lib/api/centerFilter';
import { redactScheduleSummary } from '@/lib/business/studentFinance';
import { students, classGroups, formations, paymentSchedules, payments } from '@/lib/db/schema';
import { and, eq, ilike, or, inArray, desc, count } from 'drizzle-orm';

export const GET = withApiRoute(async (_req, { tx, orgId, scope, perms, searchParams }) => {
  const search = searchParams.get('search')?.trim();
  const formationIds = searchParams.getAll('formationId');
  const statuses = searchParams.getAll('status');
  const centerIds = scope.effective(parseCenterIds(searchParams));
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '10', 10) || 10));
  const filters = [eq(students.organizationId, orgId)];
  if (search) filters.push(or(ilike(students.firstName, `%${search}%`), ilike(students.lastName, `%${search}%`), ilike(students.matricule, `%${search}%`))!);
  if (statuses.length) filters.push(inArray(students.currentStatus, statuses));
  if (formationIds.length) filters.push(inArray(classGroups.formationId, formationIds));
  if (centerIds.length) filters.push(inArray(classGroups.centerId, centerIds));
  const where = and(...filters);
  const [totalRow] = await tx.select({ value: count() }).from(students).innerJoin(classGroups, eq(classGroups.id, students.classId)).where(where);
  const rows = await tx.select({ student: students }).from(students).innerJoin(classGroups, eq(classGroups.id, students.classId)).where(where).orderBy(desc(students.createdAt)).limit(pageSize).offset((page - 1) * pageSize);
  const total = Number(totalRow?.value ?? 0);
  const level = perms.studentFinance;
  const data = await Promise.all(rows.map(async ({ student }) => {
    const scheduleRows = await tx.select({ status: paymentSchedules.status, remainingAmount: paymentSchedules.remainingAmount, installments: paymentSchedules.installments }).from(paymentSchedules).where(eq(paymentSchedules.studentId, student.id)).limit(1);
    const live = scheduleRows[0] ? withLiveStatus(scheduleRows[0]) : undefined;
    return { ...student, schedule: redactScheduleSummary(live ? { status: live.status, remainingAmount: live.remainingAmount } : undefined, level) };
  }));
  return NextResponse.json({ data, meta: { total, page, pageSize } });
}, { permission: { resource: 'students', action: 'read' } });

export const POST = withApiRoute(async (req, { tx, orgId, userId, scope, perms }) => {
  const body = createStudentSchema.parse(await req.json());
  const [classRow] = await tx.select({ classGroup: classGroups, formation: formations }).from(classGroups).innerJoin(formations, eq(formations.id, classGroups.formationId)).where(and(eq(classGroups.id, body.classId), eq(classGroups.organizationId, orgId))).limit(1);
  if (!classRow) throw new ApiError(400, 'Classe introuvable.', 'CLASS_NOT_FOUND');
  const classGroup = { ...classRow.classGroup, formation: classRow.formation };
  scope.assertCenter(classGroup.centerId);
  if (body.registrationFee > classGroup.formation.totalCost) throw new ApiError(400, `Les frais d'inscription dépassent le coût de la formation (${classGroup.formation.totalCost} FCFA).`, 'FEE_EXCEEDS_COST');
  await assertClassHasRoom(tx, classGroup);
  if (isActiveStatus(body.currentStatus)) await assertStudentQuota(tx, orgId);
  const matricule = await generateStudentMatricule(tx, orgId);
  const initial = buildInitialSchedule({ totalCost: classGroup.formation.totalCost, registrationFee: body.registrationFee, installmentsCount: body.installmentsCount, installmentInterval: body.installmentInterval, enrollmentDate: body.enrollmentDate });
  const [student] = await tx.insert(students).values({ matricule, firstName: body.firstName, lastName: body.lastName, contact: body.contact, email: body.email || undefined, gender: body.gender, currentStatus: body.currentStatus, currentLevel: body.currentLevel, classId: body.classId, enrollmentDate: new Date(body.enrollmentDate), organizationId: orgId }).returning();
  const [schedule] = await tx.insert(paymentSchedules).values({ studentId: student.id, organizationId: orgId, totalAmount: initial.totalAmount, paidAmount: initial.paidAmount, remainingAmount: initial.remainingAmount, status: initial.status, registrationFee: body.registrationFee, installmentsCount: body.installmentsCount, installmentInterval: body.installmentInterval, installments: initial.installments as object }).returning();
  let payment = null;
  if (body.registrationFee > 0) {
    [payment] = await tx.insert(payments).values({ studentId: student.id, organizationId: orgId, amount: body.registrationFee, date: new Date(body.enrollmentDate), method: body.paymentMethod, motif: "Frais d'inscription", recordedById: userId }).returning();
  }
  const finalSchedule = payment ? await rebuildScheduleForStudent(tx, student.id, orgId) : schedule;
  const full = perms.studentFinance === 'full';
  return NextResponse.json({ student, schedule: full ? finalSchedule : null, payment: full ? payment : null }, { status: 201 });
}, { permission: { resource: 'students', action: 'write' } });
