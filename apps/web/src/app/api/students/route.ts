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

export const GET = withApiRoute(async (_req, { tx, orgId, scope, perms, searchParams }) => {
  const search = searchParams.get('search')?.trim();
  const formationIds = searchParams.getAll('formationId');
  const statuses = searchParams.getAll('status');
  const centerIds = scope.effective(parseCenterIds(searchParams));
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '10', 10) || 10));

  const where = {
    organizationId: orgId,
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { matricule: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(formationIds.length || centerIds.length
      ? {
          classGroup: {
            ...(formationIds.length ? { formationId: { in: formationIds } } : {}),
            ...(centerIds.length ? { centerId: { in: centerIds } } : {}),
          },
        }
      : {}),
    ...(statuses.length ? { currentStatus: { in: statuses } } : {}),
  };

  const [total, students] = await Promise.all([
    tx.student.count({ where }),
    tx.student.findMany({
      where,
      include: { schedules: { select: { status: true, remainingAmount: true, installments: true }, take: 1 } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const level = perms.studentFinance;
  const data = students.map(({ schedules, ...s }) => {
    const live = schedules[0] ? withLiveStatus(schedules[0]) : undefined;
    return { ...s, schedule: redactScheduleSummary(live && { status: live.status, remainingAmount: live.remainingAmount }, level) };
  });

  return NextResponse.json({ data, meta: { total, page, pageSize } });
}, { permission: { resource: 'students', action: 'read' } });

export const POST = withApiRoute(async (req, { tx, orgId, userId, scope, perms }) => {
  const body = createStudentSchema.parse(await req.json());

  const classGroup = await tx.classGroup.findFirst({
    where: { id: body.classId, organizationId: orgId, ...scope.classGroup() },
    include: { formation: true },
  });
  if (!classGroup) throw new ApiError(400, 'Classe introuvable.', 'CLASS_NOT_FOUND');

  if (body.registrationFee > classGroup.formation.totalCost) {
    throw new ApiError(400, `Les frais d'inscription dépassent le coût de la formation (${classGroup.formation.totalCost} FCFA).`, 'FEE_EXCEEDS_COST');
  }

  // Classe ouverte et place libre (seuls les étudiants actifs comptent : un abandon libère sa place).
  await assertClassHasRoom(tx, classGroup);

  // Quota du forfait : un étudiant inscrit directement comme abandonné ou diplômé n'en prend pas.
  if (isActiveStatus(body.currentStatus)) await assertStudentQuota(tx, orgId);

  const matricule = await generateStudentMatricule(tx, orgId);
  const initial = buildInitialSchedule({
    totalCost: classGroup.formation.totalCost,
    registrationFee: body.registrationFee,
    installmentsCount: body.installmentsCount,
    installmentInterval: body.installmentInterval,
    enrollmentDate: body.enrollmentDate,
  });

  const student = await tx.student.create({
    data: {
      matricule,
      firstName: body.firstName,
      lastName: body.lastName,
      contact: body.contact,
      email: body.email || undefined,
      gender: body.gender,
      currentStatus: body.currentStatus,
      currentLevel: body.currentLevel,
      classId: body.classId,
      enrollmentDate: new Date(body.enrollmentDate),
      organizationId: orgId,
    },
  });

  const schedule = await tx.paymentSchedule.create({
    data: {
      studentId: student.id,
      organizationId: orgId,
      totalAmount: initial.totalAmount,
      paidAmount: initial.paidAmount,
      remainingAmount: initial.remainingAmount,
      status: initial.status,
      registrationFee: body.registrationFee,
      installmentsCount: body.installmentsCount,
      installmentInterval: body.installmentInterval,
      installments: initial.installments as unknown as object,
    },
  });

  const payment = body.registrationFee > 0
    ? await tx.payment.create({
        data: {
          studentId: student.id,
          organizationId: orgId,
          amount: body.registrationFee,
          date: new Date(body.enrollmentDate),
          method: body.paymentMethod,
          motif: "Frais d'inscription",
          recordedById: userId,
        },
      })
    : null;

  // Rejoue le paiement d'inscription à travers le même moteur que toute autre mutation de
  // paiement, pour que `schedule` reflète l'état réel (installments/paidAmount) dès la création.
  const finalSchedule = payment
    ? await rebuildScheduleForStudent(tx, student.id, orgId)
    : schedule;

  // L'inscription (frais et échéancier) est ouverte à qui peut écrire les étudiants ; les montants
  // ne sont renvoyés qu'aux rôles qui voient le détail financier.
  const full = perms.studentFinance === 'full';
  return NextResponse.json(
    { student, schedule: full ? finalSchedule : null, payment: full ? payment : null },
    { status: 201 }
  );
}, { permission: { resource: 'students', action: 'write' } });
