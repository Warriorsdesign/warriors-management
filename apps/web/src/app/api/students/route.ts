import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { PERMISSIONS } from '@/lib/auth/roles';
import { createStudentSchema } from '@/lib/validation/students';
import { generateStudentMatricule } from '@/lib/business/matricule';
import { buildInitialSchedule, rebuildScheduleForStudent } from '@/lib/business/paymentSchedule';
import { ApiError } from '@/lib/api/errors';
import { parseCenterIds } from '@/lib/api/centerFilter';

export const GET = withApiRoute(async (_req, { tx, orgId, searchParams }) => {
  const search = searchParams.get('search')?.trim();
  const formationIds = searchParams.getAll('formationId');
  const statuses = searchParams.getAll('status');
  const centerIds = parseCenterIds(searchParams);
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
      include: { schedules: { select: { status: true, remainingAmount: true }, take: 1 } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const data = students.map(({ schedules, ...s }) => ({ ...s, schedule: schedules[0] ?? null }));

  return NextResponse.json({ data, meta: { total, page, pageSize } });
}, { permission: { resource: 'students', action: 'read' } });

export const POST = withApiRoute(async (req, { tx, orgId, userId }) => {
  const body = createStudentSchema.parse(await req.json());

  const classGroup = await tx.classGroup.findFirst({
    where: { id: body.classId, organizationId: orgId },
    include: { formation: true },
  });
  if (!classGroup) throw new ApiError(400, 'Classe introuvable.', 'CLASS_NOT_FOUND');

  // Vérification de la capacité de la classe
  const studentsInClass = await tx.student.count({
    where: { classId: body.classId },
  });

  if (studentsInClass >= classGroup.capacity) {
    throw new ApiError(403, `La classe est complète (capacité maximum de ${classGroup.capacity} atteinte).`, 'CLASS_FULL');
  }

  // Vérification du quota d'abonnement (maxStudents)
  const sub = await tx.subscription.findUnique({
    where: { organizationId: orgId },
    select: { maxStudents: true, plan: true },
  });

  if (!sub) {
    throw new ApiError(400, 'Abonnement introuvable.', 'SUBSCRIPTION_NOT_FOUND');
  }

  const studentsCount = await tx.student.count({
    where: { organizationId: orgId },
  });

  if (sub.maxStudents !== -1 && studentsCount >= sub.maxStudents) {
    throw new ApiError(
      403,
      `Quota atteint. Votre plan actuel (${sub.plan?.name || 'Essai'}) est limité à ${sub.maxStudents} étudiant(s). Veuillez contacter l'administrateur de Warriors Management via admin@warriors-management.com pour passer à un plan supérieur.`,
      'QUOTA_EXCEEDED'
    );
  }

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

  return NextResponse.json({ student, schedule: finalSchedule, payment }, { status: 201 });
}, { permission: { resource: 'students', action: 'write' } });
