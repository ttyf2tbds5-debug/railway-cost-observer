import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { authorize, body, failure, HttpError, json } from '@/lib/http';
import { encrypt } from '@/lib/security';
import { dashboard } from '@/lib/dashboard';
import { syncConnection } from '@/lib/sync';
import { csvCell } from '@/lib/cost';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ path: string[] }> };
export async function GET(request: NextRequest, context: Context) {
  try {
    await authorize(request);
    const { path } = await context.params;
    if (path.join('/') === 'dashboard') return json(await dashboard());
    if (path.join('/') === 'audit') return json(await db.audit.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }));
    if (path.join('/') === 'export') {
      const rows = await db.snapshot.findMany({ orderBy: { createdAt: 'desc' }, take: 10000, include: { project: { select: { name: true } } } });
      const csv = [['project','captured_at','period_start','period_end','estimated_usd','linear_forecast_usd'], ...rows.map(r => [r.project.name,r.createdAt.toISOString(),r.periodStart.toISOString(),r.periodEnd.toISOString(),r.cost,r.forecast])].map(row => row.map(csvCell).join(',')).join('\r\n');
      return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="cost-history.csv"', 'Cache-Control': 'no-store' } });
    }
    throw new HttpError(404, 'NOT_FOUND');
  } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest, context: Context) {
  try {
    await authorize(request, true);
    const { path } = await context.params;
    if (path.join('/') === 'connections') {
      const input = z.object({ name: z.string().trim().min(1).max(80), workspaceId: z.uuid(), token: z.string().min(20).max(2048) }).strict().parse(await body(request));
      if (await db.connection.count() >= 20) throw new HttpError(409, 'CONNECTION_LIMIT');
      if (await db.connection.findUnique({ where: { workspaceId: input.workspaceId } })) throw new HttpError(409, 'WORKSPACE_ALREADY_CONNECTED');
      const connection = await db.$transaction(async tx => {
        const c = await tx.connection.create({ data: { ...input, token: encrypt(input.token) } });
        await tx.audit.create({ data: { action: 'connection.create', subject: c.id } });
        return c;
      });
      return json({ id: connection.id, name: connection.name }, 201);
    }
    if (path.length === 3 && path[0] === 'connections' && path[2] === 'sync') {
      if (!await db.connection.findUnique({ where: { id: path[1] } })) throw new HttpError(404, 'NOT_FOUND');
      try { return json(await syncConnection(path[1])); }
      catch (error) { const code = error instanceof Error ? error.message : 'SYNC_FAILED'; throw new HttpError(['SYNC_IN_PROGRESS','SYNC_COOLDOWN'].includes(code) ? 409 : 502, code); }
    }
    if (path.length === 3 && path[0] === 'projects' && path[2] === 'budget') {
      const input = z.object({ budget: z.number().finite().positive().max(1_000_000).nullable() }).strict().parse(await body(request));
      const result = await db.project.updateMany({ where: { id: path[1] }, data: input });
      if (!result.count) throw new HttpError(404, 'NOT_FOUND');
      await db.audit.create({ data: { action: 'budget.update', subject: path[1] } });
      return json({ ok: true });
    }
    if (path.length === 3 && path[0] === 'alerts' && path[2] === 'acknowledge') {
      const result = await db.alert.updateMany({ where: { id: path[1] }, data: { acknowledgedAt: new Date() } });
      if (!result.count) throw new HttpError(404, 'NOT_FOUND');
      await db.audit.create({ data: { action: 'alert.acknowledge', subject: path[1] } });
      return json({ ok: true });
    }
    if (path.length === 3 && path[0] === 'projects' && path[2] === 'policy') {
      const input=z.object({alertsEnabled:z.boolean(),forecastAlerts:z.boolean(),anomalyMultiplier:z.number().finite().min(1.5).max(20)}).strict().parse(await body(request));
      const result=await db.project.updateMany({where:{id:path[1]},data:input});
      if(!result.count)throw new HttpError(404,'NOT_FOUND');
      await db.audit.create({data:{action:'policy.update',subject:path[1]}});
      return json({ok:true});
    }
    throw new HttpError(404, 'NOT_FOUND');
  } catch (error) { return failure(error); }
}
export async function DELETE(request: NextRequest, context: Context) {
  try {
    await authorize(request, true);
    const { path } = await context.params;
    if (path.length !== 2 || path[0] !== 'connections') throw new HttpError(404, 'NOT_FOUND');
    await db.$transaction(async tx => {
      await tx.connection.deleteMany({ where: { id: path[1] } });
      await tx.audit.create({ data: { action: 'connection.delete', subject: path[1] } });
    });
    return json({ ok: true });
  } catch (error) { return failure(error); }
}
