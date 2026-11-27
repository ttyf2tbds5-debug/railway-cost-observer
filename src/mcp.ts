import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
const base = new URL(process.env.COST_OBSERVER_URL??'http://localhost:3000');
if(base.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(base.hostname))throw new Error('HTTPS_REQUIRED');
const token=process.env.COST_OBSERVER_TOKEN;
if(!token||token.length<32)throw new Error('COST_OBSERVER_TOKEN_REQUIRED');
const server = new McpServer({name:'railway-cost-observer',version:'0.2.0-rc.1'});
for(const [name,path,description] of [
  ['cost_observer_status','/api/ready','Check whether your Cost Observer installation is configured and its database is ready.'],
  ['cost_observer_dashboard','/api/v1/dashboard','Read Railway resource cost estimates, local budgets, recent usage snapshots and alerts. Estimates exclude platform fees, discounts and tax. This tool never modifies Railway.'],
  ['cost_observer_audit','/api/v1/audit','Read the latest 100 local configuration and sync audit entries. Does not expose API tokens.']
]){
  server.registerTool(name,{description,inputSchema:{},annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true}},async()=>{
    try {
      const response=await fetch(new URL(path,base),{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(15000),redirect:'error'});
      if(!response.ok)return {isError:true,content:[{type:'text',text:JSON.stringify({error:{code:`HTTP_${response.status}`}})}]};
      const result=await response.json();
      return {content:[{type:'text',text:JSON.stringify(result)}],structuredContent:{result}};
    }catch{return {isError:true,content:[{type:'text',text:'{"error":{"code":"CONNECTION_FAILED"}}'}]};}
  });
}
await server.connect(new StdioServerTransport());
