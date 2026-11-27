import {spawn,spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
import {PrismaClient} from '@prisma/client';
import {createServer} from 'node:net';
const port=await new Promise((resolve,reject)=>{const probe=createServer();probe.on('error',reject);probe.listen(0,'127.0.0.1',()=>{const port=probe.address().port;probe.close(()=>resolve(port));});});
const base=`http://127.0.0.1:${port}`;
const url=`file:${resolve('data/benchmark.db').replaceAll('\\','/')}`;
const token=randomBytes(32).toString('hex');
const environment={...process.env,DATABASE_URL:url,ADMIN_TOKEN:token,ENCRYPTION_KEY:randomBytes(32).toString('hex'),APP_URL:base,PORT:String(port),NEXT_TELEMETRY_DISABLED:'1'};
const migrated=spawnSync(process.execPath,['scripts/migrate.mjs'],{env:environment,encoding:'utf8'});if(migrated.status!==0)throw new Error('benchmark migration failed');
const db=new PrismaClient({datasourceUrl:url});await db.connection.deleteMany();await db.rateLimit.deleteMany();
const connection=await db.connection.create({data:{name:'Synthetic benchmark',workspaceId:'synthetic-benchmark',token:'not-a-real-token'}});
const now=new Date();const start=new Date(+now-10*86400_000);const end=new Date(+start+30*86400_000);
for(let j=0;j<3;j++)await db.project.create({data:{id:`benchmark-${j}`,name:`Synthetic project ${j}`,connectionId:connection.id,budget:50,snapshots:{create:Array.from({length:96},(_,i)=>({periodStart:start,periodEnd:end,createdAt:new Date(+start+i*900000),cost:i*.03,forecast:25,metrics:'[]'}))}}});
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{env:environment,stdio:['ignore','pipe','pipe']});
server.stdout.on('data',data=>process.stdout.write(data));server.stderr.on('data',data=>process.stderr.write(data));
try{
 let ready=false;for(let i=0;i<60;i++){if(server.exitCode!==null)throw new Error('benchmark server exited');try{if((await fetch(`${base}/api/ready`)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}if(!ready)throw new Error('benchmark server not ready');
 if(!(await fetch(`${base}/api/v1/dashboard`,{headers:{Authorization:`Bearer ${token}`}})).ok)throw new Error('benchmark authentication failed');
 const results=[];
 for(const [concurrency,count] of [[1,30],[8,80],[32,160]]){
   const samples=[];let errors=0,cursor=0;const statuses={};const started=performance.now();
   await Promise.all(Array.from({length:concurrency},async()=>{while(cursor++<count){const t=performance.now();try{const r=await fetch(`${base}/api/v1/dashboard`,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(15000)});statuses[r.status]=(statuses[r.status]??0)+1;const body=await r.text();if(!r.ok){errors++;if(errors===1)console.log('Benchmark first error',r.status,body);}}catch{errors++;}samples.push(performance.now()-t);}}));
   const elapsed=performance.now()-started;samples.sort((a,b)=>a-b);
   results.push({concurrency,requests:count,errors,statuses,p50ms:+samples[Math.floor(samples.length*.5)].toFixed(2),p95ms:+samples[Math.floor(samples.length*.95)].toFixed(2),requestsPerSecond:+(count/(elapsed/1000)).toFixed(2)});
 }
 let memory=null;
 if(process.platform==='win32'){
   const measured=spawnSync('powershell',['-NoProfile','-Command',`Get-Process -Id ${server.pid} | Select-Object WorkingSet64,PeakWorkingSet64 | ConvertTo-Json -Compress`],{encoding:'utf8'});
   if(measured.status===0)memory=JSON.parse(measured.stdout);
 }
 mkdirSync('test-results',{recursive:true});writeFileSync('test-results/benchmark.json',JSON.stringify({date:new Date().toISOString(),environment:'Local Windows / Node '+process.version,scope:'Production Next server; 3 synthetic projects, 96 snapshots each. No Railway or paid API calls. Not a Railway benchmark.',results,memory},null,2));
 console.log(JSON.stringify({results,memory}));
}finally{server.kill();await db.$disconnect();}
