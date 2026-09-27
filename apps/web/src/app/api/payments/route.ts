import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { ApiError } from '@/lib/api/errors';
import { PERMISSIONS } from '@/lib/auth/roles';
import { createPaymentSchema } from '@/lib/validation/payments';
import { rebuildScheduleForStudent } from '@/lib/business/paymentSchedule';
import { parseCenterIds } from '@/lib/api/centerFilter';

export const GET = withApiRoute(async (_req, { tx, orgId, searchParams }) => {
  const studentId = searchParams.get('studentId') ?? undefined;
  const search = searchParams.get('search')?.trim();
  const centerIds = parseCenterIds(searchParams);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '10', 10) || 10));

  const where = {
    organizationId: orgId,
    ...(studentId ? { studentId } : {}),
    ...(search || centerIds.length
      ? {
          student: {
            ...(search
              ? {
                  OR: [
                    { firstName: { contains: search, mode: 'insensitive' as const } },
                    { lastName: { contains: search, mode: 'insensitive' as const } },
                    { matricule: { contains: search, mode: 'insensitive' as const } },
                  ],
                }
              : {}),
            ...(centerIds.length ? { classGroup: { centerId: { in: centerIds } } } : {}),
          },
        }
      : {}),
  };

  const [total, payments] = await Promise.all([
    tx.payment.count({ where }),
    tx.payment.findMany({
      where,
      include: {
        student: { select: { firstName: true, lastName: true, matricule: true } },
        recordedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({ data: payments, meta: { total, page, pageSize } });
}, { permission: { resource: 'payments', action: 'read' } });

export const POST = withApiRoute(async (req, { tx, orgId, userId }) => {
  const body = createPaymentSchema.parse(await req.json());

  const student = await findOrgScopedOrThrow(
    () => tx.student.findFirst({ where: { id: body.studentId, organizationId: orgId } }),
    'Student not found'
  );
  if (!student) throw new ApiError(400, 'Étudiant introuvable.', 'STUDENT_NOT_FOUND');

  const payment = await tx.payment.create({
    data: {
      studentId: student.id,
      organizationId: orgId,
      amount: body.amount,
      date: body.date ? new Date(body.date) : new Date(),
      method: body.method,
      motif: body.motif,
      reference: body.reference,
      recordedById: userId,
    },
  });

  const schedule = await rebuildScheduleForStudent(tx, student.id, orgId);

  return NextResponse.json({ payment, schedule }, { status: 201 });
}, { permission: { resource: 'payments', action: 'write' } });
