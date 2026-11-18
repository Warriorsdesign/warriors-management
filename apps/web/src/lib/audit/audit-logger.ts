import { adminPrisma } from '@/lib/db/admin';

export interface LogAuditParams {
  actorId: string;
  actorEmail: string;
  actorName: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  details?: any;
}

/**
 * Enregistre un événement d'audit dans la base de données.
 * Conçu pour être non-bloquant en cas d'erreur ponctuelle.
 */
export async function logAuditEvent(params: LogAuditParams): Promise<void> {
  try {
    await adminPrisma.auditLog.create({
      data: {
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        actorName: params.actorName,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId ?? null,
        details: params.details ?? undefined,
      },
    });
  } catch (error) {
    console.error('Failed to record audit log:', error);
  }
}
