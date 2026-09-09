import { z } from 'zod';

export const createFormationSchema = z
  .object({
    name: z.string().trim().min(1, 'Veuillez renseigner le nom de la formation.'),
    duration: z.number().int().positive('Durée invalide.'),
    totalCost: z.number().nonnegative('Coût total invalide.'),
    hasLevels: z.boolean().default(false),
    levelCount: z.number().int().positive().optional(),
    status: z.enum(['actif', 'inactif']).default('actif'),
  })
  .refine((d) => !d.hasLevels || (d.levelCount && d.levelCount > 0), {
    message: 'Nombre de niveaux invalide.',
    path: ['levelCount'],
  });

export const updateFormationSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    duration: z.number().int().positive().optional(),
    totalCost: z.number().nonnegative().optional(),
    hasLevels: z.boolean().optional(),
    levelCount: z.number().int().positive().optional(),
    status: z.enum(['actif', 'inactif']).optional(),
  })
  .refine((d) => d.hasLevels !== true || d.levelCount === undefined || d.levelCount > 0, {
    message: 'Nombre de niveaux invalide.',
    path: ['levelCount'],
  });

export const updateLevelSchema = z.object({
  name: z.string().trim().min(1, 'Le nom du niveau est requis.'),
});
