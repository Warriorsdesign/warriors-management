import { z } from 'zod';
import { PERMISSION_RESOURCES } from '@/lib/auth/permissionCatalog';

const permissionRowSchema = z.object({
  resource: z.enum(PERMISSION_RESOURCES),
  canRead: z.boolean(),
  canWrite: z.boolean(),
});

export const createRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Le nom du rôle est requis.')
    .max(40, 'Le nom du rôle est limité à 40 caractères.'),
  description: z.string().trim().max(200).optional().nullable(),
  permissions: z.array(permissionRowSchema).default([]),
});

export const updateRoleSchema = createRoleSchema.partial();
