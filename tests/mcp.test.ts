import {it,expect} from 'vitest';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
it('negotiates MCP and exposes three read-only tools without a paid AI call',async()=>{
 const client=new Client({name:'local-test-client',version:'1.0.0'});
 const transport=new StdioClientTransport({command:process.execPath,args:['--import','tsx','src/mcp.ts'],env:{...Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>typeof entry[1]==='string')),COST_OBSERVER_URL:'http://127.0.0.1:1',COST_OBSERVER_TOKEN:'local-fixture-token-not-a-real-secret-0000'}});
 try {await client.connect(transport);const tools=await client.listTools();expect(tools.tools).toHaveLength(3);expect(tools.tools.every(t=>t.annotations?.readOnlyHint===true)).toBe(true);const result=await client.callTool({name:'cost_observer_status',arguments:{}});expect(result.isError).toBe(true);expect(JSON.stringify(result)).toContain('CONNECTION_FAILED');}
 finally{await client.close();}
},15000);
