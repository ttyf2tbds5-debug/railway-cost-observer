import {beforeAll,afterAll,beforeEach,it,expect,vi} from 'vitest';
import {readFileSync,existsSync,mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createServer,type Server,type RequestOptions} from 'node:https';
import type {IncomingMessage} from 'node:http';
import {safePost} from '../src/lib/notifications';
const state=vi.hoisted(()=>({port:0,status:200,body:'{"ok":true}',requests:0,resolution:'8.8.8.8',pins:[] as string[],cert:Buffer.alloc(0)}));
vi.mock('node:dns/promises',()=>({lookup:vi.fn(async()=>[{address:state.resolution,family:4}])}));
vi.mock('node:https',async importOriginal=>{
 const original=await importOriginal<typeof import('node:https')>();
 return {...original,request:(url:URL,options:RequestOptions,callback:(r:IncomingMessage)=>void)=>{
   // Run the production pinning callback, then route the test socket to a local TLS fixture.
   options.lookup!(url.hostname,{family:4,all:false} as never,((error:Error|null,address:string)=>{if(error)throw error;state.pins.push(address);}) as never);
   return original.request({...options,hostname:'127.0.0.1',port:state.port,path:url.pathname,servername:'notify.example.test',ca:state.cert,lookup:undefined},callback);
 }};
});
let server:Server;
beforeAll(async()=>{
 mkdirSync('data/tls-fixture',{recursive:true});
 const openssl=process.platform==='win32'?'C:/Program Files/Git/usr/bin/openssl.exe':'openssl';
 if(!existsSync('data/tls-fixture/cert.pem')){
  const created=spawnSync(openssl,['req','-x509','-newkey','rsa:2048','-nodes','-keyout','data/tls-fixture/key.pem','-out','data/tls-fixture/cert.pem','-days','2','-subj','/CN=notify.example.test','-addext','subjectAltName=DNS:notify.example.test'],{encoding:'utf8'});
  if(created.status!==0)throw new Error('OpenSSL is required for local TLS fixture generation');
 }
 state.cert=readFileSync('data/tls-fixture/cert.pem');
 server=createServer({key:readFileSync('data/tls-fixture/key.pem'),cert:state.cert},(req,res)=>{state.requests++;req.resume();res.writeHead(state.status,{'Content-Type':'application/json','Location':'https://internal.invalid'});res.end(state.body);});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',()=>resolve()));const address=server.address();if(!address||typeof address==='string')throw new Error('No listener');state.port=address.port;
});
afterAll(()=>new Promise<void>(resolve=>{if(server)server.close(()=>resolve());else resolve();}));
beforeEach(()=>{state.status=200;state.body='{"ok":true}';state.requests=0;state.resolution='8.8.8.8';state.pins=[];});
it('delivers over certificate-verified TLS with the validated address pinned',async()=>{
 await safePost('https://notify.example.test/hook',{id:'synthetic'},true);expect(state.requests).toBe(1);expect(state.pins).toEqual(['8.8.8.8']);
});
it('rejects private resolution before opening a socket',async()=>{state.resolution='169.254.169.254';await expect(safePost('https://notify.example.test/hook',{})).rejects.toThrow('UNSAFE_NOTIFICATION_ADDRESS');expect(state.requests).toBe(0);});
it('never follows an HTTPS redirect',async()=>{state.status=302;await expect(safePost('https://notify.example.test/hook',{})).rejects.toThrow('NOTIFICATION_REJECTED');expect(state.requests).toBe(1);});
it('treats Telegram ok=false as failed even on HTTP 200',async()=>{state.body='{"ok":false}';await expect(safePost('https://notify.example.test/hook',{},true)).rejects.toThrow('NOTIFICATION_REJECTED');});
it('bounds response memory',async()=>{state.body='x'.repeat(70000);await expect(safePost('https://notify.example.test/hook',{})).rejects.toThrow();});
