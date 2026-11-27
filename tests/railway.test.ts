import { describe,it,expect,vi } from 'vitest';
import { collect,query,CONTEXT_QUERY,RAILWAY_API } from '../src/lib/railway';
const context={workspace:{id:'workspace',name:'Fixture workspace',customer:{billingPeriod:{start:'2026-11-01T00:00:00Z',end:'2026-12-01T00:00:00Z'}}}};
const usage={usage:[{measurement:'CPU_USAGE',value:100,tags:{projectId:'project',serviceId:'service'}}],projects:{pageInfo:{hasNextPage:false},edges:[{node:{id:'project',name:'Fixture app',deletedAt:null}}]}};
describe('Railway adapter with mocked HTTP, not live API',()=>{
 it('uses fixed official endpoint, bearer auth and query-only requests',async()=>{
   const fetcher=vi.fn().mockResolvedValueOnce(Response.json({data:context})).mockResolvedValueOnce(Response.json({data:usage}));
   const result=await collect('mock-token','workspace',fetcher);
   expect(result.usage[0].value).toBe(100);
   expect(fetcher.mock.calls[0][0]).toBe(RAILWAY_API);
   expect(fetcher.mock.calls[0][1].headers.Authorization).toBe('Bearer mock-token');
   expect(JSON.parse(fetcher.mock.calls[1][1].body).variables.startDate).toBe(context.workspace.customer.billingPeriod.start);
 });
 it('does not follow redirects that could leak a token',async()=>{
   const f=vi.fn().mockResolvedValue(Response.json({data:context}));await query('mock-token',CONTEXT_QUERY,{},f);expect(f.mock.calls[0][1].redirect).toBe('error');
 });
 it('refuses mutations',async()=>await expect(query('x','mutation Delete {x}',{},vi.fn())).rejects.toThrow('READ_ONLY_ONLY'));
 it('rejects partial GraphQL errors and hides upstream messages',async()=>await expect(query('x',CONTEXT_QUERY,{},vi.fn().mockResolvedValue(Response.json({data:context,errors:[{message:'secret'}]})))).rejects.toThrow('RAILWAY_QUERY_FAILED'));
 it('rejects truncated project sets',async()=>await expect(collect('x','workspace',vi.fn().mockResolvedValueOnce(Response.json({data:context})).mockResolvedValueOnce(Response.json({data:{...usage,projects:{...usage.projects,pageInfo:{hasNextPage:true}}}})))).rejects.toThrow('RAILWAY_PROJECT_LIMIT'));
 it('reports rate limiting',async()=>await expect(query('x',CONTEXT_QUERY,{},vi.fn().mockResolvedValue(new Response('',{status:429})))).rejects.toThrow('RAILWAY_RATE_LIMIT'));
});
