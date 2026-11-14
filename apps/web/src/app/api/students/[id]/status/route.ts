import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import type { Prisma } from '@prisma/client';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { changeStatusSchema } from '@/lib/validation/students';
import { assertClassHasRoom, isActiveStatus } from '@/lib/business/classStatus';
import { assertStudentQuota } from '@/lib/business/studentQuota';

type Params = { id: string };
type ProgressionLog = { id: string; date: string; status: string; level?: string | null; recordedBy: string; reason?: string };

export const PATCH = withApiRoute<Params>(async (req, { tx, orgId, userId, scope, params }) => {
  const body = changeStatusSchema.parse(await req.json());
  const student = await findOrgScopedOrThrow(() =>
    tx.student.findFirst({ where: { id: params.id, organizationId: orgId, ...scope.student() } })
  );

  if (!isActiveStatus(student.currentStatus) && isActiveStatus(body.status)) {
    const classGroup = await tx.classGroup.findFirstOrThrow({ where: { id: student.classId, organizationId: orgId } });
    await assertClassHasRoom(tx, classGroup, student.id);
    await assertStudentQuota(tx, orgId);
  }

  const existingLogs = (student.progressionLogs as ProgressionLog[] | null) ?? [];
  const newLog: ProgressionLog = {
    id: randomUUID(),
    date: new Date().toISOString(),
    status: body.status,
    level: student.currentLevel,
    recordedBy: userId,
    reason: body.motif,
  };

  const updated = await tx.student.update({
    where: { id: student.id },
    data: {
      currentStatus: body.status,
      progressionLogs: [newLog, ...existingLogs] as unknown as Prisma.InputJsonValue,
    },
  });
  return NextResponse.json(updated);
}, { permission: { resource: 'students', action: 'write' } });
