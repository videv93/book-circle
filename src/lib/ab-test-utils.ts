export interface VariantResult {
  variant: string;
  clicks: number;
  conversions: number;
  conversionRate: number;
}

export type SignificanceLevel =
  | 'Not significant'
  | 'Marginally significant (p < 0.1)'
  | 'Significant (p < 0.05)'
  | 'Highly significant (p < 0.01)';

export function calculateChiSquared(variants: VariantResult[]): number {
  if (variants.length < 2) return 0;

  const totalClicks = variants.reduce((sum, v) => sum + v.clicks, 0);
  const totalConversions = variants.reduce((sum, v) => sum + v.conversions, 0);
  if (totalClicks === 0) return 0;

  const overallRate = totalConversions / totalClicks;

  let chiSq = 0;
  for (const v of variants) {
    const expectedConversions = v.clicks * overallRate;
    const expectedNonConversions = v.clicks * (1 - overallRate);

    if (expectedConversions > 0) {
      chiSq += (v.conversions - expectedConversions) ** 2 / expectedConversions;
    }
    const nonConversions = v.clicks - v.conversions;
    if (expectedNonConversions > 0) {
      chiSq += (nonConversions - expectedNonConversions) ** 2 / expectedNonConversions;
    }
  }

  return Math.round(chiSq * 1000) / 1000;
}

export function getSignificanceLevel(chiSquared: number): SignificanceLevel {
  if (chiSquared >= 6.635) return 'Highly significant (p < 0.01)';
  if (chiSquared >= 3.841) return 'Significant (p < 0.05)';
  if (chiSquared >= 2.706) return 'Marginally significant (p < 0.1)';
  return 'Not significant';
}
