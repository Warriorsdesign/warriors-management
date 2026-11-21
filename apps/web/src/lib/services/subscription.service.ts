import { and, eq, inArray, lt, notInArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { organizations, subscriptions } from '@/lib/db/schema';
import { logAuditEvent } from '@/lib/audit/audit-logger';

export const subscriptionService = {
  async checkAndSuspendExpiredOrgs(): Promise<number> {
    try {
      const now = new Date();
      const expiredSubscriptions = await db.select({
        id: subscriptions.id,
        organizationId: subscriptions.organizationId,
        endDate: subscriptions.endDate,
      }).from(subscriptions).where(and(
        lt(subscriptions.endDate, now),
        notInArray(subscriptions.status, ['suspended', 'expired']),
      ));
      if (expiredSubscriptions.length === 0) return 0;

      const subscriptionIds = expiredSubscriptions.map((subscription) => subscription.id);
      const organizationIds = expiredSubscriptions.map((subscription) => subscription.organizationId);
      await db.update(subscriptions).set({ status: 'suspended' })
        .where(inArray(subscriptions.id, subscriptionIds));
      await db.update(organizations).set({ status: 'suspendu' })
        .where(inArray(organizations.id, organizationIds));

      for (const subscription of expiredSubscriptions) {
        await logAuditEvent({
          actorId: 'system',
          actorEmail: 'system@warriors-management.com',
          actorName: 'Système',
          action: 'ORGANIZATION_SUSPENDED',
          resource: 'Organization',
          resourceId: subscription.organizationId,
          details: {
            reason: 'Abonnement expiré',
            expiredAt: subscription.endDate,
            subscriptionId: subscription.id,
          },
        });
      }
      return expiredSubscriptions.length;
    } catch (error) {
      console.error('Erreur lors de checkAndSuspendExpiredOrgs:', error);
      return 0;
    }
  },

  async reactivateOrganization(organizationId: string): Promise<boolean> {
    try {
      await db.update(organizations).set({ status: 'actif' }).where(eq(organizations.id, organizationId));
      await db.update(subscriptions).set({ status: 'active' })
        .where(eq(subscriptions.organizationId, organizationId));
      return true;
    } catch (error) {
      console.error('Erreur lors de reactivateOrganization:', error);
      return false;
    }
  },
};
