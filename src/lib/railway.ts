import { z } from 'zod';
import { RATES } from './cost';
export const RAILWAY_API = 'https://backboard.railway.com/graphql/v2';
export const CONTEXT_QUERY = `query CostObserverContext($workspaceId: String!) {
  workspace(workspaceId: $workspaceId) { id name customer { billingPeriod { start end } } }
}`;
export const USAGE_QUERY = `query CostObserverUsage($workspaceId: String!, $measurements: [MetricMeasurement!]!, $startDate: DateTime!, $endDate: DateTime!) {
  usage(workspaceId: $workspaceId, measurements: $measurements, groupBy: [PROJECT_ID, SERVICE_ID], startDate: $startDate, endDate: $endDate, includeDeleted: true) { measurement value tags { projectId serviceId } }
  projects(first: 5000, includeDeleted: true, workspaceId: $workspaceId) { pageInfo { hasNextPage } edges { node { id name deletedAt } } }
}`;
const contextSchema = z.object({ workspace: z.object({ id: z.string(), name: z.string(), customer: z.object({ billingPeriod: z.object({ start: z.iso.datetime({ offset: true }), end: z.iso.datetime({ offset: true }) }) }) }) });
const usageSchema = z.object({
  usage: z.array(z.object({ measurement: z.enum(Object.keys(RATES) as [keyof typeof RATES, ...(keyof typeof RATES)[]]), value: z.number().finite().nonnegative(), tags: z.object({ projectId: z.string().nullable().optional(), serviceId: z.string().nullable().optional() }) })),
  projects: z.object({ pageInfo: z.object({ hasNextPage: z.boolean() }), edges: z.array(z.object({ node: z.object({ id: z.string(), name: z.string(), deletedAt: z.string().nullable() }) })) })
});
export async function query(token: string, document: string, variables: Record<string, unknown>, fetcher = fetch) {
  if (!document.trimStart().startsWith('query ') || /\bmutation\b/.test(document)) throw new Error('READ_ONLY_ONLY');
  let response: Response;
  try {
    response = await fetcher(RAILWAY_API, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ query: document, variables }), signal: AbortSignal.timeout(20_000), redirect: 'error' });
  } catch { throw new Error('RAILWAY_NETWORK_ERROR'); }
  if (!response.ok) throw new Error(response.status === 429 ? 'RAILWAY_RATE_LIMIT' : response.status === 401 || response.status === 403 ? 'RAILWAY_AUTH_FAILED' : 'RAILWAY_UNAVAILABLE');
  const result = await response.json();
  if (result.errors?.length || !result.data) throw new Error('RAILWAY_QUERY_FAILED');
  return result.data as unknown;
}
export async function collect(token: string, workspaceId: string, fetcher = fetch) {
  const context = contextSchema.parse(await query(token, CONTEXT_QUERY, { workspaceId }, fetcher));
  const { start, end } = context.workspace.customer.billingPeriod;
  const now = new Date();
  if (+new Date(start) > +now || +new Date(end) <= +new Date(start)) throw new Error('RAILWAY_INVALID_PERIOD');
  const usage = usageSchema.parse(await query(token, USAGE_QUERY, { workspaceId, measurements: Object.keys(RATES), startDate: start, endDate: new Date(Math.min(+now, +new Date(end))).toISOString() }, fetcher));
  if (usage.projects.pageInfo.hasNextPage) throw new Error('RAILWAY_PROJECT_LIMIT');
  if (usage.usage.some(row => !row.tags.projectId)) throw new Error('RAILWAY_MISSING_PROJECT_TAG');
  return { name: context.workspace.name, start: new Date(start), end: new Date(end), now, ...usage };
}
