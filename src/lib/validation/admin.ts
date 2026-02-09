import { z } from 'zod';

export const userRoleEnum = z.enum(['USER', 'AUTHOR', 'ADMIN', 'SUPER_ADMIN']);

export const promoteUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  newRole: userRoleEnum,
});

export type PromoteUserInput = z.infer<typeof promoteUserSchema>;

export const adminActionSchema = z.object({
  actionType: z.string().min(1, 'Action type is required'),
  targetId: z.string().min(1, 'Target ID is required'),
  targetType: z.string().min(1, 'Target type is required'),
  details: z.record(z.string(), z.unknown()).optional(),
});

export type AdminActionInput = z.infer<typeof adminActionSchema>;
