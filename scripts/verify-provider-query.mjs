// Read-only compatibility check using an already authenticated Railway CLI.
// This does not prove the app's Bearer-token transport; no CLI credentials are extracted.
import {spawn} from 'node:child_process';
import {join} from 'node:path';
import {collect} from '../src/lib/railway.ts';
const workspaceId=process.env.VERIFY_WORKSPACE_ID;
if(!workspaceId)throw new Error('VERIFY_WORKSPACE_ID is required');
const fetchViaCLI=async(_url,options)=>{
 const {query,variables}=JSON.parse(options.body);
 if(!query.trimStart().startsWith('query '))throw new Error('Only read queries allowed');
 const env={...process.env,COST_OBSERVER_VERIFY_VARIABLES:JSON.stringify(variables)};
 return await new Promise((resolve,reject)=>{
   const command=process.env.RAILWAY_CLI_PATH??(process.platform==='win32'?join(process.env.APPDATA??'','npm','node_modules','@railway','cli','bin','railway.exe'):'railway');
   const child=spawn(command,['api','--compact','--variables',JSON.stringify(variables)],{env,stdio:['pipe','pipe','pipe']});
   let output='';child.stdout.on('data',d=>output+=d);child.stderr.resume();child.on('error',reject);
   child.on('close',code=>{if(code!==0)reject(new Error('CLI_QUERY_FAILED'));else{try{resolve(Response.json(JSON.parse(output)));}catch{reject(new Error('CLI_RESPONSE_INVALID'));}}});
   child.stdin.end(query);
 });
};
const result=await collect('transport-replaced-by-local-cli',workspaceId,fetchViaCLI);
console.log(JSON.stringify({verified:true,transport:'Existing Railway CLI auth, not app bearer auth',projects:result.projects.edges.length,usageRows:result.usage.length,periodValid:+result.end>+result.start}));
