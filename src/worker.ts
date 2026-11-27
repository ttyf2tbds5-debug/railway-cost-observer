import { db } from './lib/db';
import { validateConfig } from './lib/security';
import { syncConnection } from './lib/sync';
import { deliverAlerts } from './lib/notifications';
validateConfig();
let stopping=false;
process.on('SIGINT',()=>{stopping=true;}); process.on('SIGTERM',()=>{stopping=true;});
async function main() {
  while(!stopping) {
    const connections=await db.connection.findMany({where:{nextSyncAt:{lte:new Date()}},select:{id:true,lastSync:true}});
    for(const c of connections) {
      if(stopping)break;
      if(c.lastSync && Date.now()-+c.lastSync<15*60_000)continue;
      try{await syncConnection(c.id);}catch{console.error(JSON.stringify({event:'sync_failed',connectionId:c.id}));}
    }
    await deliverAlerts();
    const before=new Date(Date.now()-90*86400_000);
    await db.snapshot.deleteMany({where:{createdAt:{lt:before}}});
    await db.alert.deleteMany({where:{createdAt:{lt:before}}});
    await db.audit.deleteMany({where:{createdAt:{lt:before}}});
    for(let i=0;i<60&&!stopping;i++)await new Promise(r=>setTimeout(r,1000));
  }
  await db.$disconnect();
}
main().catch(async()=>{console.error('Worker stopped unexpectedly');await db.$disconnect();process.exitCode=1;});
