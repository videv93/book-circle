import { prisma } from '@/lib/prisma';

/**
 * Check if a user has premium status.
 * Single source of truth for premium gating across the application.
 *
 * @param userId - The user's ID to check
 * @returns true if user has PREMIUM status, false otherwise (including non-existent users)
 */
export async function isPremium(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { premiumStatus: true },
  });

  return user?.premiumStatus === 'PREMIUM';
}
