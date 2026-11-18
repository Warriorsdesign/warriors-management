import { z } from 'zod';

export const studentStatusSchema = z.enum([
  'en_cours', 'niveau_terminee', 'formation_terminee',
  'suspendu', 'nouvel_inscrit', 'reinscrit', 'abandonne',
]);

export const paymentMethodSchema = z.enum(['Espèces', 'Bank Transfer', 'Mobile Money', 'Virement', 'Chèque']);

export const installmentIntervalSchema = z.enum([
  '1_semaine', '2_semaines', '3_semaines', '1_mois', '2_mois', '3_mois', '4_mois',
]);

export const createStudentSchema = z.object({
  firstName: z.string().trim().min(1, 'Le prénom est requis.'),
  lastName: z.string().trim().min(1, 'Le nom est requis.'),
  gender: z.enum(['Male', 'Female']),
  contact: z.string().trim().min(1, 'Le contact est requis.'),
  email: z.string().trim().email().optional().or(z.literal('')),
  classId: z.string().min(1, 'La classe est requise.'),
  currentLevel: z.string().optional(),
  currentStatus: studentStatusSchema.default('nouvel_inscrit'),
  enrollmentDate: z.string().min(1, "La date d'inscription est requise."),
  registrationFee: z.number().nonnegative().default(0),
  paymentMethod: paymentMethodSchema.default('Espèces'),
  installmentsCount: z.number().int().nonnegative().default(0),
  installmentInterval: installmentIntervalSchema.default('1_mois'),
});

export const updateStudentSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  contact: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional().or(z.literal('')),
  classId: z.string().min(1).optional(),
  enrollmentDate: z.string().optional(),
});

export const changeClassSchema = z.object({
  classId: z.string().min(1, 'La classe est requise.'),
});

export const changeStatusSchema = z.object({
  status: studentStatusSchema,
  motif: z.string().trim().optional(),
});

export const changeLevelSchema = z.object({
  levelId: z.string().min(1, 'Le niveau est requis.'),
});

export const recordPaymentSchema = z.object({
  amount: z.number().positive('Le montant doit être positif.'),
  method: paymentMethodSchema,
  motif: z.string().trim().optional(),
  reference: z.string().trim().optional(),
  date: z.string().optional(),
});
