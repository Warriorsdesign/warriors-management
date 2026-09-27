import { adminPrisma } from '@/lib/db/admin';
import { logAuditEvent } from '@/lib/audit/audit-logger';

export const subscriptionService = {
  /**
   * Vérifie et suspend automatiquement les organisations dont l'abonnement est expiré.
   * On considère expiré si endDate < now et status !== 'suspended'.
   * @returns Le nombre d'organisations suspendues
   */
  async checkAndSuspendExpiredOrgs(): Promise<number> {
    try {
      const now = new Date();
      
      // Trouver tous les abonnements expirés qui ne sont pas encore suspendus
      const expiredSubscriptions = await adminPrisma.subscription.findMany({
        where: {
          endDate: { lt: now },
          status: { notIn: ['suspended', 'expired'] },
        },
        include: {
          organization: true,
        },
      });

      if (expiredSubscriptions.length === 0) {
        return 0;
      }

      const subscriptionIds = expiredSubscriptions.map(sub => sub.id);
      const organizationIds = expiredSubscriptions.map(sub => sub.organizationId);

      // Mettre à jour les abonnements
      await adminPrisma.subscription.updateMany({
        where: {
          id: { in: subscriptionIds },
        },
        data: {
          status: 'suspended',
        },
      });

      // Mettre à jour les organisations (optionnel, si on veut un statut 'suspendu' direct sur l'org)
      await adminPrisma.organization.updateMany({
        where: {
          id: { in: organizationIds },
        },
        data: {
          status: 'suspendu',
        },
      });

      // Logger l'audit pour chaque suspension
      for (const sub of expiredSubscriptions) {
        await logAuditEvent({
          actorId: 'system',
          actorEmail: 'system@warriors-management.com',
          actorName: 'Système',
          action: 'ORGANIZATION_SUSPENDED',
          resource: 'Organization',
          resourceId: sub.organizationId,
          details: {
            reason: 'Abonnement expiré',
            expiredAt: sub.endDate,
            subscriptionId: sub.id,
          },
        });
      }

      return expiredSubscriptions.length;
    } catch (error) {
      console.error('Erreur lors de checkAndSuspendExpiredOrgs:', error);
      return 0;
    }
  },

  /**
   * Réactive une organisation après paiement ou modification de la licence
   */
  async reactivateOrganization(organizationId: string): Promise<boolean> {
    try {
      await adminPrisma.organization.update({
        where: { id: organizationId },
        data: { status: 'actif' },
      });
      
      // On s'assure que l'abonnement n'est plus "suspended" ou "expired"
      await adminPrisma.subscription.update({
        where: { organizationId },
        data: { status: 'active' },
      });

      return true;
    } catch (error) {
      console.error('Erreur lors de reactivateOrganization:', error);
      return false;
    }
  }
};
