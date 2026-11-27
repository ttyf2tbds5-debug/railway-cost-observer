import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
process.loadEnvFile();
const port=await new Promise((resolve,reject)=>{const probe=createServer();probe.on('error',reject);probe.listen(0,'127.0.0.1',()=>{const port=probe.address().port;probe.close(()=>resolve(port));});});
const base=`http://127.0.0.1:${port}`;
const env={...process.env,PORT:String(port),APP_URL:base,COST_OBSERVER_URL:base,COST_OBSERVER_TOKEN:process.env.VIEWER_TOKEN};
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{env,stdio:'ignore'});
async function run(command,args){return new Promise((resolve,reject)=>{const child=spawn(command,args,{env,stdio:['ignore','pipe','pipe']});let out='';child.stdout.on('data',d=>out+=d);child.stderr.on('data',d=>out+=d);child.on('error',reject);child.on('exit',code=>{if(code!==0)reject(new Error(out));else{console.log(args.join(' ')+': '+out.trim());resolve();}});});}
try{
 let ready=false;for(let i=0;i<60;i++){if(server.exitCode!==null)throw new Error('example server exited');try{if((await fetch(base+'/api/ready')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}if(!ready)throw new Error('example server not ready');
 await run(process.execPath,['examples/node.mjs']);await run('python',['examples/python.py']);await run(process.execPath,['examples/railway-health.mjs']);await run(process.execPath,['examples/mcp-client.mjs']);
 await run(process.execPath,['--import','tsx','--input-type=module','-e',"import {getCostSummary} from './examples/next-server.ts'; const r=await getCostSummary(); if(r.meta.estimateOnly!==true)throw new Error('bad result'); console.log('Next server helper: verified');"]);
}finally{server.kill();}
