import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
const client=new Client({name:'example-cost-consumer',version:'1.0.0'});
const transport=new StdioClientTransport({command:process.execPath,args:['--import','tsx','src/mcp.ts'],env:{...process.env}});
try { await client.connect(transport); const response=await client.callTool({name:'cost_observer_status',arguments:{}}); console.log(JSON.stringify(response)); if(response.isError)process.exitCode=1; } finally {await client.close();}
