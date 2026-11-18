import { CONTACT } from '@/lib/config/contact';

/**
 * Accès d'une organisation selon son statut et son abonnement. Appliqué à la connexion ET à
 * chaque requête API (withApiRoute) : la suspension en base (subscriptionService) est faite
 * de façon différée, il ne faut donc pas attendre qu'elle ait tourné pour couper l'accès à la
 * fin d'un essai ou d'un abonnement.
 */
export interface AccessBlock {
  code: 'TRIAL_ENDED' | 'SUBSCRIPTION_ENDED' | 'ORG_SUSPENDED';
  message: string;
}

const CONTACT_LINE = `Écrivez-nous à ${CONTACT.email} ou sur WhatsApp au ${CONTACT.whatsappDisplay}. Vos données sont conservées.`;

export function getAccessBlock(
  org: { status: string; name?: string },
  subscription: { status: string; endDate: Date; plan?: { price: number } | null } | null,
  now = new Date()
): AccessBlock | null {
  const expired = subscription !== null && subscription.endDate.getTime() < now.getTime();
  // Essai = statut « trial » ou forfait gratuit (la suspension différée remplace le statut « trial »).
  const isTrial = subscription?.status === 'trial' || subscription?.plan?.price === 0;
  if (expired && isTrial) {
    return { code: 'TRIAL_ENDED', message: `Votre essai gratuit est terminé. Pour continuer, choisissez un forfait. ${CONTACT_LINE}` };
  }
  if (expired) {
    return { code: 'SUBSCRIPTION_ENDED', message: `Votre abonnement est arrivé à échéance. Pour le renouveler : ${CONTACT_LINE}` };
  }
  if (org.status === 'suspendu') {
    return {
      code: 'ORG_SUSPENDED',
      message: `L'accès de ${org.name ? `« ${org.name} »` : 'votre organisation'} est suspendu. ${CONTACT_LINE}`,
    };
  }
  return null;
}
