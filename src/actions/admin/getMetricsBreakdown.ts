'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';
import type { ActionResult } from '@/actions/books/types';

export interface BreakdownEntry {
  date: string;
  value: number;
}

export interface MetricsBreakdown {
  category: string;
  entries: BreakdownEntry[];
  total: number;
}

export async function getMetricsBreakdown(
  category: 'user' | 'engagement' | 'social' | 'content',
  startDate?: string,
  endDate?: string,
): Promise<ActionResult<MetricsBreakdown>> {
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

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    start.setUTCHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : new Date();
    end.setUTCHours(23, 59, 59, 999);

    let rawData: Array<{ date: Date; count: bigint }>;

    switch (category) {
      case 'user':
        rawData = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
          SELECT DATE_TRUNC('day', created_at) as date, COUNT(*) as count
          FROM users WHERE created_at >= ${start} AND created_at <= ${end}
          GROUP BY DATE_TRUNC('day', created_at) ORDER BY date ASC`;
        break;
      case 'engagement':
        rawData = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
          SELECT DATE_TRUNC('day', started_at) as date, COUNT(*) as count
          FROM reading_sessions WHERE started_at >= ${start} AND started_at <= ${end}
          GROUP BY DATE_TRUNC('day', started_at) ORDER BY date ASC`;
        break;
      case 'social':
        rawData = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
          SELECT DATE_TRUNC('day', created_at) as date, COUNT(*) as count
          FROM kudos WHERE created_at >= ${start} AND created_at <= ${end}
          GROUP BY DATE_TRUNC('day', created_at) ORDER BY date ASC`;
        break;
      case 'content':
        rawData = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
          SELECT DATE_TRUNC('day', created_at) as date, COUNT(*) as count
          FROM books WHERE created_at >= ${start} AND created_at <= ${end}
          GROUP BY DATE_TRUNC('day', created_at) ORDER BY date ASC`;
        break;
    }

    const entries: BreakdownEntry[] = rawData.map((row) => ({
      date: new Date(row.date).toISOString().split('T')[0],
      value: Number(row.count),
    }));

    const total = entries.reduce((sum, e) => sum + e.value, 0);

    return {
      success: true,
      data: { category, entries, total },
    };
  } catch (error) {
    console.error('getMetricsBreakdown error:', error);
    return { success: false, error: 'Failed to fetch metrics breakdown' };
  }
}
