import { z } from 'zod';
import { paymentMethodSchema } from './students';

export const createPaymentSchema = z.object({
  studentId: z.string().min(1, "L'étudiant est requis."),
  amount: z.number().positive('Le montant doit être positif.'),
  method: paymentMethodSchema,
  date: z.string().optional(),
  motif: z.string().trim().optional(),
  reference: z.string().trim().optional(),
});

export const updatePaymentSchema = z.object({
  amount: z.number().positive().optional(),
  method: paymentMethodSchema.optional(),
  date: z.string().optional(),
  motif: z.string().trim().optional(),
  reference: z.string().trim().optional(),
});
