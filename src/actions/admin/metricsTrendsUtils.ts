import type { TrendDataPoint } from './getMetricsTrends';

interface RawDateCount {
  date: Date;
  count: bigint;
}

export function fillMissingDays(raw: RawDateCount[], startDate: Date, days: number): TrendDataPoint[] {
  const dateMap = new Map<string, number>();
  for (const row of raw) {
    const key = new Date(row.date).toISOString().split('T')[0];
    dateMap.set(key, Number(row.count));
  }

  const result: TrendDataPoint[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().split('T')[0];
    result.push({ date: key, value: dateMap.get(key) ?? 0 });
  }
  return result;
}

export function calculatePercentageChange(current: TrendDataPoint[], previous: TrendDataPoint[]): number {
  const currentTotal = current.reduce((sum, p) => sum + p.value, 0);
  const previousTotal = previous.reduce((sum, p) => sum + p.value, 0);
  if (previousTotal === 0) return currentTotal > 0 ? 100 : 0;
  return Math.round(((currentTotal - previousTotal) / previousTotal) * 1000) / 10;
}

export function detectAnomaly(dataPoints: TrendDataPoint[]): boolean {
  if (dataPoints.length < 7) return false;
  const values = dataPoints.map((p) => p.value);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return false;
  const latest = values[values.length - 1];
  return Math.abs(latest - mean) > 2 * stdDev;
}
