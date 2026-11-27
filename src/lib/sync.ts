import { db } from './db';
import { decrypt } from './security';
import { collect } from './railway';
import { anomaly, costOf, forecast } from './cost';

export async function syncConnection(id: string) {
  const now = new Date();
  await db.lease.upsert({ where: { id }, create: { id, expiresAt: new Date(0) }, update: {} });
  const acquired = await db.lease.updateMany({ where: { id, expiresAt: { lte: now } }, data: { expiresAt: new Date(+now + 120_000) } });
  if (acquired.count !== 1) throw new Error('SYNC_IN_PROGRESS');
  try {
    const connection = await db.connection.findUniqueOrThrow({ where: { id } });
    if (connection.lastSync && +now - +connection.lastSync < 60_000) throw new Error('SYNC_COOLDOWN');
    const result = await collect(decrypt(connection.token), connection.workspaceId);
    const names = new Map(result.projects.edges.map(e => [e.node.id, e.node.name]));
    for (const metric of result.usage) if (metric.tags.projectId && !names.has(metric.tags.projectId)) names.set(metric.tags.projectId, 'Deleted project');
    await db.$transaction(async tx => {
      for (const [projectId, name] of names) {
        const project = await tx.project.upsert({ where: { id: projectId }, create: { id: projectId, name, connectionId: id }, update: { name } });
        if (project.connectionId !== id) throw new Error('PROJECT_CONNECTION_CONFLICT');
        const metrics = result.usage.filter(m => m.tags.projectId === projectId);
        const cost = costOf(metrics);
        const projected = forecast(cost, result.start, result.end, result.now);
        const previous = await tx.snapshot.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' }, take: 25 });
        const snapshot = await tx.snapshot.create({ data: { projectId, createdAt: result.now, periodStart: result.start, periodEnd: result.end, cost, forecast: projected, metrics: JSON.stringify(metrics) } });
        const alerts: { kind: string; message: string; suffix: string }[] = [];
        if (project.alertsEnabled && project.budget !== null && cost >= project.budget) alerts.push({ kind: 'budget', message: `Usage estimate $${cost.toFixed(2)} reached the $${project.budget.toFixed(2)} budget.`, suffix: `${result.start.toISOString()}:${project.budget}` });
        else if (project.alertsEnabled && project.forecastAlerts && project.budget !== null && projected !== null && projected > project.budget) alerts.push({ kind: 'forecast', message: `Linear projection $${projected.toFixed(2)} exceeds the $${project.budget.toFixed(2)} budget.`, suffix: `${result.start.toISOString()}:${project.budget}` });
        const spike = anomaly(previous, snapshot, project.anomalyMultiplier);
        if (project.alertsEnabled && spike) alerts.push({ kind: 'anomaly', message: `Hourly spend increased to $${spike.hourlyRate.toFixed(3)} from a median $${spike.baseline.toFixed(3)}.`, suffix: result.now.toISOString().slice(0, 10) });
        for (const a of alerts) await tx.alert.upsert({ where: { dedupeKey: `${projectId}:${a.kind}:${a.suffix}` }, create: { projectId, kind: a.kind, message: a.message, dedupeKey: `${projectId}:${a.kind}:${a.suffix}` }, update: {} });
      }
      await tx.connection.update({ where: { id }, data: { lastSync: result.now, lastError: null, failureCount: 0, nextSyncAt: new Date(Date.now()+900_000) } });
      await tx.audit.create({ data: { action: 'connection.sync', subject: id } });
    }, { timeout: 30_000 });
    return { projects: names.size, syncedAt: result.now };
  } catch (error) {
    const code = error instanceof Error && /^[A-Z_]+$/.test(error.message) ? error.message : 'SYNC_FAILED';
    if (!['SYNC_COOLDOWN', 'SYNC_IN_PROGRESS'].includes(code)) {
      const failed = await db.connection.findUnique({where:{id},select:{failureCount:true}});
      if(failed)await db.connection.updateMany({where:{id},data:{lastError:code,failureCount:{increment:1},nextSyncAt:new Date(Date.now()+Math.min(3600,60*2**Math.min(failed.failureCount,6))*1000)}});
    }
    throw new Error(code);
  } finally { await db.lease.update({ where: { id }, data: { expiresAt: new Date(0) } }); }
}
