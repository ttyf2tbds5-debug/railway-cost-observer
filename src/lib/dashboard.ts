import { db } from './db';
import { resourceInsights } from './insights';
export async function dashboard() {
  const [connections, projects, alerts] = await Promise.all([
    db.connection.findMany({ select: { id: true, name: true, workspaceId: true, lastSync: true, lastError: true }, orderBy: { createdAt: 'asc' } }),
    db.project.findMany({ include: { snapshots: { orderBy: { createdAt: 'desc' }, take: 96 } }, orderBy: { name: 'asc' } }),
    db.alert.findMany({ include: { project: { select: { name: true } }, deliveries: {select:{channel:true,attempts:true,deliveredAt:true,lastError:true}} }, orderBy: { createdAt: 'desc' }, take: 100 })
  ]);
  return { connections, projects: projects.map(p=>({...p,insights:p.snapshots[0]?resourceInsights(JSON.parse(p.snapshots[0].metrics),p.snapshots[0].periodStart,p.snapshots[0].createdAt):[]})), alerts, meta: { currency: 'USD', pricingAsOf: '2026-11-27', estimateOnly: true, forecastMethod: 'linear-billing-period', automaticInterventions: false, retentionDays: 90 } };
}
