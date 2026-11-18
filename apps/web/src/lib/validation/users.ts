import { z } from 'zod';

const rolesSchema = z
  .array(z.string())
  .min(1, 'Au moins un rôle est requis.');

export const createUserSchema = z.object({
  firstName: z.string().trim().min(1, 'Le prénom est requis.'),
  lastName: z.string().trim().min(1, 'Le nom est requis.'),
  email: z.string().trim().email('Email invalide.'),
  roles: rolesSchema,
  status: z.enum(['actif', 'inactif']).default('actif'),
  centerIds: z.array(z.string()).default([]),
});

export const updateUserSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  roles: rolesSchema.optional(),
  status: z.enum(['actif', 'inactif']).optional(),
  centerIds: z.array(z.string()).optional(),
  matricule: z.string().optional(),
});

export const updateOwnProfileSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  avatarUrl: z.string().nullable().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis.'),
  newPassword: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères.'),
});
