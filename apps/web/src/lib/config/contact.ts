/**
 * Coordonnées commerciales affichées sur la landing, la page d'inscription et les messages de
 * fin d'essai. Provisoires : à mettre à jour ici uniquement.
 */
export const CONTACT = {
  email: 'warriorsdesigner@gmail.com',
  /** Numéro affiché (format local camerounais). */
  whatsappDisplay: '693 82 09 14',
  /** Numéro international sans « + » pour les liens wa.me. */
  whatsappNumber: '237693820914',
} as const;

export function whatsappLink(message: string): string {
  return `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

/** Durée de l'essai gratuit ouvert depuis la page publique d'inscription. */
export const TRIAL_DAYS = 14;
