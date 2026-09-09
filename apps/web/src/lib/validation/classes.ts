import { z } from 'zod';

export const createClassSchema = z.object({
  name: z.string().trim().min(1, 'Le nom est requis.'),
  formationId: z.string().min(1, 'La formation est requise.'),
  centerId: z.string().min(1, 'Le centre est requis.'),
  capacity: z.number().int().positive('Capacité invalide.'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const updateClassSchema = z.object({
  name: z.string().trim().min(1).optional(),
  capacity: z.number().int().positive().optional(),
  status: z.enum(['ouverte', 'complete', 'cloturee']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
