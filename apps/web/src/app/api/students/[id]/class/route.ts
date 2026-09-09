import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { ApiError } from '@/lib/api/errors';
import { PERMISSIONS } from '@/lib/auth/roles';
import { changeClassSchema } from '@/lib/validation/students';

type Params = { id: string };

export const PATCH = withApiRoute<Params>(async (req, { tx, orgId, params }) => {
  const body = changeClassSchema.parse(await req.json());
  const student = await findOrgScopedOrThrow(() =>
    tx.student.findFirst({ where: { id: params.id, organizationId: orgId } })
  );
  const classGroup = await tx.classGroup.findFirst({ where: { id: body.classId, organizationId: orgId } });
  if (!classGroup) throw new ApiError(400, 'Classe introuvable.', 'CLASS_NOT_FOUND');

  const updated = await tx.student.update({ where: { id: student.id }, data: { classId: body.classId } });
  return NextResponse.json(updated);
}, { allowedRoles: PERMISSIONS.students.write });
