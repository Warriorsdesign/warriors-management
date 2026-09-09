import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import type { Prisma } from '@prisma/client';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { ApiError } from '@/lib/api/errors';
import { PERMISSIONS } from '@/lib/auth/roles';
import { changeLevelSchema } from '@/lib/validation/students';
import type { Level } from '@/lib/business/formations';

type Params = { id: string };
type ProgressionLog = { id: string; date: string; status: string; level?: string | null; recordedBy: string; reason?: string };

export const PATCH = withApiRoute<Params>(async (req, { tx, orgId, userId, params }) => {
  const body = changeLevelSchema.parse(await req.json());
  const student = await findOrgScopedOrThrow(() =>
    tx.student.findFirst({
      where: { id: params.id, organizationId: orgId },
      include: { classGroup: { include: { formation: true } } },
    })
  );

  const levels = (student.classGroup.formation.levels as Level[] | null) ?? [];
  if (!student.classGroup.formation.hasLevels || !levels.some((l) => l.id === body.levelId)) {
    throw new ApiError(400, 'Niveau invalide pour cette formation.', 'INVALID_LEVEL');
  }

  const existingLogs = (student.progressionLogs as ProgressionLog[] | null) ?? [];
  const newLog: ProgressionLog = {
    id: randomUUID(),
    date: new Date().toISOString(),
    status: 'en_cours',
    level: body.levelId,
    recordedBy: userId,
    reason: 'Passage au niveau suivant',
  };

  const updated = await tx.student.update({
    where: { id: student.id },
    data: {
      currentLevel: body.levelId,
      currentStatus: 'en_cours',
      progressionLogs: [newLog, ...existingLogs] as unknown as Prisma.InputJsonValue,
    },
  });
  return NextResponse.json(updated);
}, { allowedRoles: PERMISSIONS.students.write });
