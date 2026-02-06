'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDateInTimezone, getYesterdayBounds } from '@/lib/dates';
import type { ActionResult } from '@/actions/books/types';

const checkStreakSchema = z.object({
  timezone: z.string().optional().default('UTC'),
});

export type CheckStreakInput = z.input<typeof checkStreakSchema>;

export type StreakStatusResult = {
  currentStreak: number;
  longestStreak: number;
  isAtRisk: boolean;
  missedDays: number;
  lastGoalMetDate: string | null;
  freezeUsedToday: boolean;
};

/**
 * Check the current streak status without modifying it.
 * Used on page load to evaluate if streak is at risk (missed yesterday).
 */
export async function checkStreakStatus(
  input?: CheckStreakInput
): Promise<ActionResult<StreakStatusResult>> {
  try {
    const validated = checkStreakSchema.parse(input ?? {});

    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user?.id) {
      return { success: false, error: 'You must be logged in to check streak status' };
    }

    const streak = await prisma.userStreak.findUnique({
      where: { userId: session.user.id },
    });

    if (!streak) {
      return {
        success: true,
        data: {
          currentStreak: 0,
          longestStreak: 0,
          isAtRisk: false,
          missedDays: 0,
          lastGoalMetDate: null,
          freezeUsedToday: false,
        },
      };
    }

    // If no last goal met date, streak is 0, not at risk (nothing to lose)
    if (!streak.lastGoalMetDate) {
      return {
        success: true,
        data: {
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          isAtRisk: false,
          missedDays: 0,
          lastGoalMetDate: null,
          freezeUsedToday: streak.freezeUsedToday,
        },
      };
    }

    const timezone = validated.timezone;
    const todayStr = getDateInTimezone(new Date(), timezone);
    const lastMetStr = getDateInTimezone(streak.lastGoalMetDate, timezone);

    // If goal was met today, streak is healthy
    if (lastMetStr === todayStr) {
      return {
        success: true,
        data: {
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          isAtRisk: false,
          missedDays: 0,
          lastGoalMetDate: streak.lastGoalMetDate.toISOString(),
          freezeUsedToday: streak.freezeUsedToday,
        },
      };
    }

    // Check yesterday
    const { start: yesterdayStart, end: yesterdayEnd } = getYesterdayBounds(timezone);
    const yesterdayStr = getDateInTimezone(yesterdayStart, timezone);

    if (lastMetStr === yesterdayStr) {
      // Yesterday was met — streak continues, not at risk yet (today still has time)
      return {
        success: true,
        data: {
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          isAtRisk: false,
          missedDays: 0,
          lastGoalMetDate: streak.lastGoalMetDate.toISOString(),
          freezeUsedToday: streak.freezeUsedToday,
        },
      };
    }

    // Check if yesterday had a freeze
    const yesterdayFreeze = await prisma.dailyProgress.findFirst({
      where: {
        userId: session.user.id,
        date: { gte: yesterdayStart, lt: yesterdayEnd },
        freezeUsed: true,
      },
    });

    if (yesterdayFreeze) {
      // Yesterday was frozen — streak protected
      return {
        success: true,
        data: {
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          isAtRisk: false,
          missedDays: 0,
          lastGoalMetDate: streak.lastGoalMetDate.toISOString(),
          freezeUsedToday: streak.freezeUsedToday,
        },
      };
    }

    // Streak is at risk — missed yesterday (and possibly more days)
    const lastMetTime = streak.lastGoalMetDate.getTime();
    const todayMidnight = new Date(`${todayStr}T00:00:00.000Z`);
    const diffMs = todayMidnight.getTime() - lastMetTime;
    const missedDays = Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)) - 1);

    return {
      success: true,
      data: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        isAtRisk: streak.currentStreak > 0,
        missedDays,
        lastGoalMetDate: streak.lastGoalMetDate.toISOString(),
        freezeUsedToday: streak.freezeUsedToday,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input' };
    }
    console.error('Failed to check streak status:', error);
    return { success: false, error: 'Failed to check streak status' };
  }
}
