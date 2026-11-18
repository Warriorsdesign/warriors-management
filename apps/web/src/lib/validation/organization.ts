import { z } from 'zod';
import { THEME_KEYS } from '@/lib/config/themes';

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(1, 'Le nom est requis.').optional(),
  email: z.string().trim().email().nullable().optional(),
  phone: z.string().trim().nullable().optional(),
  address: z.string().trim().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  themeColor: z.enum(THEME_KEYS, { errorMap: () => ({ message: 'Couleur inconnue.' }) }).optional(),
});
