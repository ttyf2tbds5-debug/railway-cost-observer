export const RATES = {
  CPU_USAGE: 20 / 43200,
  MEMORY_USAGE_GB: 10 / 43200,
  NETWORK_TX_GB: 0.05,
  DISK_USAGE_GB: 0.15 / 43200,
  BACKUP_USAGE_GB: 0.15 / 43200,
} as const;
export type Measurement = keyof typeof RATES;
export type Metric = { measurement: string; value: number; tags: { projectId?: string | null; serviceId?: string | null } };
export function costOf(metrics: { measurement: string; value: number }[]) {
  return metrics.reduce((sum, item) => {
    if (!(item.measurement in RATES) || !Number.isFinite(item.value) || item.value < 0) throw new Error('INVALID_USAGE');
    return sum + item.value * RATES[item.measurement as Measurement];
  }, 0);
}
export function forecast(cost: number, start: Date, end: Date, now: Date) {
  const elapsed = now.getTime() - start.getTime();
  const duration = end.getTime() - start.getTime();
  if (elapsed < 24 * 3600_000 || duration <= 0) return null;
  return cost * Math.max(1, duration / elapsed);
}
export function anomaly(previous: { cost: number; createdAt: Date; periodStart: Date }[], current: {cost: number; createdAt: Date; periodStart: Date}, multiplier = 3) {
  const rows = [...previous.filter(s => s.periodStart.getTime() === current.periodStart.getTime()), current].sort((a, b) => +a.createdAt - +b.createdAt);
  if (rows.length < 5) return null;
  const rates = rows.slice(1).map((r, i) => ({ cost: r.cost - rows[i].cost, hours: (+r.createdAt - +rows[i].createdAt) / 3600_000 })).filter(x => x.hours >= 0.08 && x.cost >= 0).map(x => x.cost / x.hours);
  if (rates.length < 4) return null;
  const last = rates.pop()!;
  const sorted = rates.sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return last > Math.max(median * multiplier, 0.05) ? { hourlyRate: last, baseline: median } : null;
}
export function csvCell(value: unknown) {
  let text = String(value ?? '');
  if (/^[=+@\-\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
