import {spawn} from 'node:child_process';
const jobs=[];
let exiting=false;
function stop(code){if(exiting)return;exiting=true;for(const j of jobs)j.kill('SIGTERM');setTimeout(()=>{for(const j of jobs)j.kill('SIGKILL');process.exit(code);},5000).unref();process.exitCode=code;}
for(const args of [['node_modules/next/dist/bin/next','start','--hostname','0.0.0.0'],['--import','tsx','src/worker.ts']]){
  const job=spawn(process.execPath,args,{stdio:'inherit',env:process.env});jobs.push(job);
  job.on('error',()=>stop(1));job.on('exit',code=>stop(code??1));
}
process.on('SIGTERM',()=>stop(0));process.on('SIGINT',()=>stop(0));
