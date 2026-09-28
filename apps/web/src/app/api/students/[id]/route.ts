import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { updateStudentSchema } from '@/lib/validation/students';
import { redactStudentFinance } from '@/lib/business/studentFinance';

type Params = { id: string };

export const GET = withApiRoute<Params>(async (_req, { tx, orgId, scope, perms, params }) => {
  const level = perms.studentFinance;
  const { schedules, payments, ...student } = await findOrgScopedOrThrow(() =>
    tx.student.findFirst({
      where: { id: params.id, organizationId: orgId, ...scope.student() },
      include: {
        classGroup: { include: { formation: true, center: true } },
        schedules: { take: 1 },
        // Paiements lus uniquement si le rôle peut voir le détail financier.
        payments: level === 'full' ? { orderBy: { date: 'desc' } } : { take: 0 },
      },
    })
  );
  return NextResponse.json({ ...student, ...redactStudentFinance(schedules[0] ?? null, payments, level) });
}, { permission: { resource: 'students', action: 'read' } });

export const PATCH = withApiRoute<Params>(async (req, { tx, orgId, scope, params }) => {
  const body = updateStudentSchema.parse(await req.json());
  const student = await findOrgScopedOrThrow(() =>
    tx.student.findFirst({ where: { id: params.id, organizationId: orgId, ...scope.student() } })
  );
  // Changement de classe via PATCH : la classe cible doit aussi être dans le périmètre.
  if (body.classId) {
    await findOrgScopedOrThrow(
      () => tx.classGroup.findFirst({ where: { id: body.classId, organizationId: orgId, ...scope.classGroup() }, select: { id: true } }),
      'Classe introuvable.'
    );
  }
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

export const DELETE = withApiRoute<Params>(async (_req, { tx, orgId, scope, params }) => {
  const student = await findOrgScopedOrThrow(() =>
    tx.student.findFirst({ where: { id: params.id, organizationId: orgId, ...scope.student() } })
  );
  await tx.student.delete({ where: { id: student.id } });
  return NextResponse.json({ success: true });
}, { permission: { resource: 'students', action: 'write' } });
