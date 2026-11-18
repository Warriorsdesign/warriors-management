import { z } from 'zod';

export const createCenterSchema = z.object({
  name: z.string().trim().min(1, 'Le nom est requis.'),
  address: z.string().trim().optional(),
  status: z.enum(['actif', 'inactif']).default('actif'),
});

export const updateCenterSchema = createCenterSchema.partial();
