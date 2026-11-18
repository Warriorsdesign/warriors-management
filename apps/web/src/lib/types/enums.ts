export type Role = 'ADMIN' | 'GESTIONNAIRE' | 'COMPTABLE';
export type UserStatus = 'actif' | 'inactif';
export type Gender = 'Male' | 'Female';

export type StudentStatus =
  | 'en_cours' | 'niveau_terminee' | 'formation_terminee'
  | 'suspendu' | 'nouvel_inscrit' | 'reinscrit' | 'abandonne';

export type InstallmentStatus = 'a_jour' | 'en_retard' | 'solde';

export type IntervalType =
  | '1_semaine' | '2_semaines' | '3_semaines'
  | '1_mois' | '2_mois' | '3_mois' | '4_mois';

export type PaymentMethod = 'Espèces' | 'Bank Transfer' | 'Mobile Money' | 'Virement' | 'Chèque';

export type ExpenseCategory = 'Loyer' | 'Salaires' | 'Équipement' | 'Électricité' | 'Internet' | 'Autre';

export type ClassStatus = 'ouverte' | 'complete' | 'cloturee';

export type OrganizationStatus = 'actif' | 'suspendu';

/** Nom d'un forfait (modifiable dans le back-office, table Plan). */
export type SubscriptionPlan = string;

export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'suspended';
