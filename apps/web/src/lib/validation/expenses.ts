import { z } from 'zod';

export const expenseCategorySchema = z.enum([
  'Loyer', 'Salaires', 'Équipement', 'Électricité', 'Internet', 'Autre',
]);

export const createExpenseSchema = z.object({
  title: z.string().trim().min(1, 'Le titre est requis.'),
  amount: z.number().positive('Le montant doit être positif.'),
  date: z.string().min(1, 'La date est requise.'),
  category: expenseCategorySchema,
  description: z.string().trim().optional(),
});

export const updateExpenseSchema = z.object({
  title: z.string().trim().min(1).optional(),
  amount: z.number().positive().optional(),
  date: z.string().optional(),
  category: expenseCategorySchema.optional(),
  description: z.string().trim().optional(),
});
