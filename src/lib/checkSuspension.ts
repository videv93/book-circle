import { prisma } from '@/lib/prisma';

export interface SuspensionStatus {
  suspended: boolean;
  suspendedUntil?: Date;
  reason?: string;
  justExpired?: boolean;
}

export async function checkSuspension(
  userId: string
): Promise<SuspensionStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { suspendedUntil: true, suspensionReason: true },
  });

  if (!user || !user.suspendedUntil) {
    return { suspended: false };
  }

  const now = new Date();

  // Active suspension
  if (user.suspendedUntil > now) {
    return {
      suspended: true,
      suspendedUntil: user.suspendedUntil,
      reason: user.suspensionReason ?? undefined,
    };
  }

  // Suspension has expired - auto-clear user fields and mark suspension record
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { suspendedUntil: null, suspensionReason: null },
    }),
    prisma.userSuspension.updateMany({
      where: { userId, liftedAt: null },
      data: { liftedAt: now },
    }),
  ]);

  return { suspended: false, justExpired: true };
}
