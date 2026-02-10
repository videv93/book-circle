'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';
import type { ActionResult } from '@/actions/books/types';
import { fillMissingDays, calculatePercentageChange, detectAnomaly } from './metricsTrendsUtils';

export interface TrendDataPoint {
  date: string; // ISO date string YYYY-MM-DD
  value: number;
}

export interface MetricTrend {
  dataPoints: TrendDataPoint[];
  percentageChange: number;
  isAnomaly: boolean;
}

export interface MetricsTrends {
  newUsers: MetricTrend;
  activeSessions: MetricTrend;
  kudosGiven: MetricTrend;
  newBooks: MetricTrend;
}

interface RawDateCount {
  date: Date;
  count: bigint;
}

export async function getMetricsTrends(): Promise<ActionResult<MetricsTrends>> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    });

    if (!adminUser || !isAdmin(adminUser)) {
      return { success: false, error: 'Forbidden' };
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
    thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setUTCDate(sixtyDaysAgo.getUTCDate() - 60);
    sixtyDaysAgo.setUTCHours(0, 0, 0, 0);

    const [
      rawNewUsersCurrent,
      rawNewUsersPrevious,
      rawSessionsCurrent,
      rawSessionsPrevious,
      rawKudosCurrent,
      rawKudosPrevious,
      rawBooksCurrent,
      rawBooksPrevious,
    ] = await Promise.all([
      prisma.$queryRaw<RawDateCount[]>`
        SELECT DATE_TRUNC('day', created_at) as date, COUNT(*) as count
        FROM users WHERE created_at >= ${thirtyDaysAgo}
        GROUP BY DATE_TRUNC('day', created_at) ORDER BY date ASC
      `,
      prisma.$queryRaw<RawDateCount[]>`
        SELECT DATE_TRUNC('day', created_at) as date, COUNT(*) as count
        FROM users WHERE created_at >= ${sixtyDaysAgo} AND created_at < ${thirtyDaysAgo}
        GROUP BY DATE_TRUNC('day', created_at) ORDER BY date ASC
      `,
      prisma.$queryRaw<RawDateCount[]>`
        SELECT DATE_TRUNC('day', started_at) as date, COUNT(*) as count
        FROM reading_sessions WHERE started_at >= ${thirtyDaysAgo}
        GROUP BY DATE_TRUNC('day', started_at) ORDER BY date ASC
      `,
      prisma.$queryRaw<RawDateCount[]>`
        SELECT DATE_TRUNC('day', started_at) as date, COUNT(*) as count
        FROM reading_sessions WHERE started_at >= ${sixtyDaysAgo} AND started_at < ${thirtyDaysAgo}
        GROUP BY DATE_TRUNC('day', started_at) ORDER BY date ASC
      `,
      prisma.$queryRaw<RawDateCount[]>`
        SELECT DATE_TRUNC('day', created_at) as date, COUNT(*) as count
        FROM kudos WHERE created_at >= ${thirtyDaysAgo}
        GROUP BY DATE_TRUNC('day', created_at) ORDER BY date ASC
      `,
      prisma.$queryRaw<RawDateCount[]>`
        SELECT DATE_TRUNC('day', created_at) as date, COUNT(*) as count
        FROM kudos WHERE created_at >= ${sixtyDaysAgo} AND created_at < ${thirtyDaysAgo}
        GROUP BY DATE_TRUNC('day', created_at) ORDER BY date ASC
      `,
      prisma.$queryRaw<RawDateCount[]>`
        SELECT DATE_TRUNC('day', created_at) as date, COUNT(*) as count
        FROM books WHERE created_at >= ${thirtyDaysAgo}
        GROUP BY DATE_TRUNC('day', created_at) ORDER BY date ASC
      `,
      prisma.$queryRaw<RawDateCount[]>`
        SELECT DATE_TRUNC('day', created_at) as date, COUNT(*) as count
        FROM books WHERE created_at >= ${sixtyDaysAgo} AND created_at < ${thirtyDaysAgo}
        GROUP BY DATE_TRUNC('day', created_at) ORDER BY date ASC
      `,
    ]);

    const newUsersCurrent = fillMissingDays(rawNewUsersCurrent, thirtyDaysAgo, 30);
    const newUsersPrevious = fillMissingDays(rawNewUsersPrevious, sixtyDaysAgo, 30);
    const sessionsCurrent = fillMissingDays(rawSessionsCurrent, thirtyDaysAgo, 30);
    const sessionsPrevious = fillMissingDays(rawSessionsPrevious, sixtyDaysAgo, 30);
    const kudosCurrent = fillMissingDays(rawKudosCurrent, thirtyDaysAgo, 30);
    const kudosPrevious = fillMissingDays(rawKudosPrevious, sixtyDaysAgo, 30);
    const booksCurrent = fillMissingDays(rawBooksCurrent, thirtyDaysAgo, 30);
    const booksPrevious = fillMissingDays(rawBooksPrevious, sixtyDaysAgo, 30);

    return {
      success: true,
      data: {
        newUsers: {
          dataPoints: newUsersCurrent,
          percentageChange: calculatePercentageChange(newUsersCurrent, newUsersPrevious),
          isAnomaly: detectAnomaly(newUsersCurrent),
        },
        activeSessions: {
          dataPoints: sessionsCurrent,
          percentageChange: calculatePercentageChange(sessionsCurrent, sessionsPrevious),
          isAnomaly: detectAnomaly(sessionsCurrent),
        },
        kudosGiven: {
          dataPoints: kudosCurrent,
          percentageChange: calculatePercentageChange(kudosCurrent, kudosPrevious),
          isAnomaly: detectAnomaly(kudosCurrent),
        },
        newBooks: {
          dataPoints: booksCurrent,
          percentageChange: calculatePercentageChange(booksCurrent, booksPrevious),
          isAnomaly: detectAnomaly(booksCurrent),
        },
      },
    };
  } catch (error) {
    console.error('getMetricsTrends error:', error);
    return { success: false, error: 'Failed to fetch metrics trends' };
  }
}

// Exported for testing
export { fillMissingDays, calculatePercentageChange, detectAnomaly };
