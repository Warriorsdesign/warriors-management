import { z } from 'zod';

/** Inscription publique (essai gratuit) : établissement + premier administrateur. */
export const signupSchema = z.object({
  organizationName: z.string().trim().min(2, "Indiquez le nom de votre établissement.").max(120),
  firstName: z.string().trim().min(1, 'Le prénom est requis.').max(80),
  lastName: z.string().trim().min(1, 'Le nom est requis.').max(80),
  email: z.string().trim().toLowerCase().email('Adresse email invalide.').max(150),
  phone: z
    .string()
    .trim()
    .min(8, 'Numéro de téléphone invalide.')
    .max(20)
    .regex(/^[+\d\s().-]+$/, 'Numéro de téléphone invalide.'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.').max(100),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: "Vous devez accepter les conditions d'utilisation." }) }),
  /** Champ piège invisible : rempli uniquement par les robots. */
  website: z.string().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
