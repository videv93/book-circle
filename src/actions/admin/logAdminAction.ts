// Internal utility — NOT a server action. Only called from other server actions.
import { prisma } from '@/lib/prisma';

interface LogAdminActionInput {
  adminId: string;
  actionType: string;
  targetId: string;
  targetType: string;
  details?: Record<string, unknown> | null;
}

export async function logAdminAction(input: LogAdminActionInput) {
  return prisma.adminAction.create({
    data: {
      adminId: input.adminId,
      actionType: input.actionType,
      targetId: input.targetId,
      targetType: input.targetType,
      details: (input.details as object) ?? undefined,
    },
  });
}
