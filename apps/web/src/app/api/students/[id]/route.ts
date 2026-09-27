import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { PERMISSIONS } from '@/lib/auth/roles';
import { updateStudentSchema } from '@/lib/validation/students';

type Params = { id: string };

export const GET = withApiRoute<Params>(async (_req, { tx, orgId, params }) => {
  const { schedules, ...student } = await findOrgScopedOrThrow(() =>
    tx.student.findFirst({
      where: { id: params.id, organizationId: orgId },
      include: {
        classGroup: { include: { formation: true, center: true } },
        schedules: { take: 1 },
        payments: { orderBy: { date: 'desc' } },
      },
    })
  );
  return NextResponse.json({ ...student, schedule: schedules[0] ?? null });
}, { permission: { resource: 'students', action: 'read' } });

export const PATCH = withApiRoute<Params>(async (req, { tx, orgId, params }) => {
  const body = updateStudentSchema.parse(await req.json());
  const student = await findOrgScopedOrThrow(() =>
    tx.student.findFirst({ where: { id: params.id, organizationId: orgId } })
  );
  const { email, enrollmentDate, ...rest } = body;
  const updated = await tx.student.update({
    where: { id: student.id },
    data: {
      ...rest,
      ...(email !== undefined ? { email: email || null } : {}),
      ...(enrollmentDate !== undefined ? { enrollmentDate: new Date(enrollmentDate) } : {}),
    },
  });
  return NextResponse.json(updated);
}, { permission: { resource: 'students', action: 'write' } });

export const DELETE = withApiRoute<Params>(async (_req, { tx, orgId, params }) => {
  const student = await findOrgScopedOrThrow(() =>
    tx.student.findFirst({ where: { id: params.id, organizationId: orgId } })
  );
  await tx.student.delete({ where: { id: student.id } });
  return NextResponse.json({ success: true });
}, { permission: { resource: 'students', action: 'write' } });
