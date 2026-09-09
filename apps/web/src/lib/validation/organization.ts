import { z } from 'zod';

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(1, 'Le nom est requis.').optional(),
  email: z.string().trim().email().nullable().optional(),
  phone: z.string().trim().nullable().optional(),
  address: z.string().trim().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
});
