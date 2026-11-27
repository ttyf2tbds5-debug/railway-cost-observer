import { costOf, type Metric } from './cost';
export type Insight = { code: string; serviceId: string | null; message: string; evidence: Record<string, number>; automaticAction: false };
export function resourceInsights(metrics: Metric[], start: Date, captured: Date): Insight[] {
  const minutes = (+captured - +start) / 60000;
  if (minutes < 1440) return [];
  const grouped = new Map<string | null, Metric[]>();
  for (const metric of metrics) { const id = metric.tags?.serviceId ?? null; grouped.set(id, [...(grouped.get(id) ?? []), metric]); }
  const result: Insight[] = [];
  for (const [serviceId, rows] of grouped) {
    const sums = Object.fromEntries(['CPU_USAGE','MEMORY_USAGE_GB','NETWORK_TX_GB','DISK_USAGE_GB'].map(m => [m, rows.filter(r=>r.measurement===m).reduce((n,r)=>n+r.value,0)]));
    const cpu = sums.CPU_USAGE / minutes, memory = sums.MEMORY_USAGE_GB / minutes, disk = sums.DISK_USAGE_GB / minutes;
    if (cpu < 0.02 && memory >= 0.5) result.push({code:'LOW_AVERAGE_CPU',serviceId,message:'Low period-average CPU with sustained memory use. Review this service for idle workers or unnecessary replicas; this does not prove the service is safe to stop.',evidence:{averageVcpu:cpu,averageMemoryGB:memory,observedMinutes:minutes},automaticAction:false});
    const total = costOf(rows), egressCost = costOf(rows.filter(r=>r.measurement==='NETWORK_TX_GB'));
    if (egressCost >= 1 && egressCost >= total * 0.2) result.push({code:'EGRESS_COST_SHARE',serviceId,message:'Public egress is a material cost. Check whether internal service traffic can use private networking and review cache behavior.',evidence:{egressGB:sums.NETWORK_TX_GB,estimatedEgressUSD:egressCost,share:egressCost/total},automaticAction:false});
    if (disk >= 10) result.push({code:'STORAGE_REVIEW',serviceId,message:'Review volume retention and old artifacts. Average stored bytes do not establish available capacity or justify deletion.',evidence:{averageDiskGB:disk,observedMinutes:minutes},automaticAction:false});
  }
  return result;
}
