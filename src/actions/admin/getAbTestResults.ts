'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';
import type { ActionResult } from '@/actions/books/types';
import {
  calculateChiSquared,
  getSignificanceLevel,
  type VariantResult,
  type SignificanceLevel,
} from '@/lib/ab-test-utils';

export type { VariantResult, SignificanceLevel } from '@/lib/ab-test-utils';

export interface AbTestResults {
  variants: VariantResult[];
  chiSquared: number;
  significance: SignificanceLevel;
}

export async function getAbTestResults(
  startDate?: string,
  endDate?: string
): Promise<ActionResult<AbTestResults>> {
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
    const end = endDate ? new Date(endDate) : now;
    const thirtyDaysAgo = new Date(end);
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
    thirtyDaysAgo.setUTCHours(0, 0, 0, 0);
    const start = startDate ? new Date(startDate) : thirtyDaysAgo;

    const dateFilter = { gte: start, lte: end };

    const [variantClicks, variantConversions] = await Promise.all([
      prisma.affiliateClick.groupBy({
        by: ['variant'],
        where: {
          createdAt: dateFilter,
          variant: { not: null },
        },
        _count: { id: true },
      }),
      prisma.affiliateClick.groupBy({
        by: ['variant'],
        where: {
          createdAt: dateFilter,
          variant: { not: null },
          converted: true,
        },
        _count: { id: true },
      }),
    ]);

    const conversionMap = new Map(
      variantConversions.map((v) => [v.variant, v._count.id])
    );

    const variants: VariantResult[] = variantClicks.map((v) => {
      const clicks = v._count.id;
      const conversions = conversionMap.get(v.variant) ?? 0;
      return {
        variant: v.variant ?? 'unknown',
        clicks,
        conversions,
        conversionRate: clicks > 0 ? Math.round((conversions / clicks) * 1000) / 10 : 0,
      };
    });

    const chiSquared = calculateChiSquared(variants);
    const significance = getSignificanceLevel(chiSquared);

    return {
      success: true,
      data: { variants, chiSquared, significance },
    };
  } catch (error) {
    console.error('getAbTestResults error:', error);
    return { success: false, error: 'Failed to fetch A/B test results' };
  }
}
