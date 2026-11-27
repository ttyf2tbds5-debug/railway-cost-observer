import { lookup } from 'node:dns/promises';
import { request } from 'node:https';
import { isIP } from 'node:net';
import nodemailer from 'nodemailer';
import { db } from './db';

export function publicIPv4(ip: string) {
  if (isIP(ip) !== 4) return false;
  const [a,b,c] = ip.split('.').map(Number);
  return !(a===0 || a===10 || a===127 || a>=224 || (a===100 && b>=64 && b<=127) || (a===169&&b===254) || (a===172&&b>=16&&b<=31) || (a===192&&(b===168||b===0||(b===88&&c===99))) || (a===198&&(b===18||b===19||(b===51&&c===100))) || (a===203&&b===0&&c===113));
}
export async function safePost(endpoint: string, payload: unknown, requireOk = false) {
  const url = new URL(endpoint);
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') || url.hash) throw new Error('UNSAFE_NOTIFICATION_URL');
  const addresses = await lookup(url.hostname, {all:true,family:4});
  if (!addresses.length || addresses.some(a=>!publicIPv4(a.address))) throw new Error('UNSAFE_NOTIFICATION_ADDRESS');
  const address = addresses[0].address;
  const bytes = Buffer.from(JSON.stringify(payload));
  await new Promise<void>((resolve,reject)=>{
    const req = request(url, {method:'POST',headers:{'Content-Type':'application/json','Content-Length':bytes.length},lookup:(_hostname,options,callback)=>{if(options.all)callback(null,[{address,family:4}]);else callback(null,address,4);},timeout:10000},res=>{
      const chunks: Buffer[]=[];let size=0;
      res.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>65536){res.destroy();reject(new Error('NOTIFICATION_RESPONSE_TOO_LARGE'));}else chunks.push(chunk);});
      res.on('error',()=>reject(new Error('NOTIFICATION_NETWORK_ERROR')));
      res.on('end',()=>{
        if(!res.statusCode||res.statusCode<200||res.statusCode>=300){reject(new Error('NOTIFICATION_REJECTED'));return;}
        if(requireOk){try{if(JSON.parse(Buffer.concat(chunks).toString()).ok!==true)throw new Error();}catch{reject(new Error('NOTIFICATION_REJECTED'));return;}}
        resolve();
      });
    });
    const deadline=setTimeout(()=>req.destroy(new Error('NOTIFICATION_TIMEOUT')),15000);
    req.on('close',()=>clearTimeout(deadline));
    req.on('timeout',()=>req.destroy(new Error('NOTIFICATION_TIMEOUT')));
    req.on('error',()=>reject(new Error('NOTIFICATION_NETWORK_ERROR')));
    req.end(bytes);
  });
}
type Channel = 'webhook'|'discord'|'telegram'|'email';
export function notificationChannels(env:Record<string,string|undefined>=process.env): Channel[] {
  const channels:Channel[]=[];
  if(env.NOTIFY_WEBHOOK_URL)channels.push(env.NOTIFY_FORMAT==='discord'?'discord':'webhook');
  if(env.DISCORD_WEBHOOK_URL&&!channels.includes('discord'))channels.push('discord');
  if(env.TELEGRAM_BOT_TOKEN||env.TELEGRAM_CHAT_ID){
    if(!/^\d+:[A-Za-z0-9_-]{20,}$/.test(env.TELEGRAM_BOT_TOKEN??'')||!/^(-?\d+|@[A-Za-z0-9_]+)$/.test(env.TELEGRAM_CHAT_ID??''))throw new Error('CONFIG_TELEGRAM');
    channels.push('telegram');
  }
  if(env.SMTP_HOST||env.SMTP_TO){
    if(!env.SMTP_HOST||!env.SMTP_FROM||!env.SMTP_TO||!['465','587'].includes(env.SMTP_PORT??'465')||/[\r\n]/.test(`${env.SMTP_FROM}${env.SMTP_TO}${env.SMTP_HOST}`))throw new Error('CONFIG_SMTP');
    if(Boolean(env.SMTP_USER)!==Boolean(env.SMTP_PASSWORD))throw new Error('CONFIG_SMTP_AUTH');
    channels.push('email');
  }
  return channels;
}
type Email = {from:string;to:string;subject:string;text:string};
export async function sendEmail(message:Email) {
  const port=Number(process.env.SMTP_PORT??465);
  const transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port,secure:port===465,requireTLS:true,auth:process.env.SMTP_USER?{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}:undefined,tls:{minVersion:'TLSv1.2',rejectUnauthorized:true},connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000,disableFileAccess:true,disableUrlAccess:true,logger:false,debug:false});
  try{const result=await transport.sendMail(message);if(result.rejected?.length)throw new Error('SMTP_REJECTED');}finally{transport.close();}
}
export async function deliverAlerts(send = safePost, mail = sendEmail) {
  const channels=notificationChannels();
  if(!channels.length)return;
  // Delivered historical events are not backfilled when adding a new destination.
  const alerts=await db.alert.findMany({where:{deliveredAt:null,project:{alertsEnabled:true},OR:[...channels.map(channel=>({deliveries:{none:{channel}}})),{deliveries:{some:{channel:{in:channels},deliveredAt:null,attempts:{lt:5},nextAttemptAt:{lte:new Date()}}}}]},orderBy:{createdAt:'asc'},take:20,include:{project:{select:{name:true}}}});
  for(const alert of alerts){
    for(const channel of channels){
      const delivery=await db.delivery.upsert({where:{alertId_channel:{alertId:alert.id,channel}},create:{alertId:alert.id,channel,nextAttemptAt:new Date(0)},update:{}});
      const now=new Date();
      const claimed=await db.delivery.updateMany({where:{id:delivery.id,deliveredAt:null,attempts:{lt:5},nextAttemptAt:{lte:now}},data:{attempts:{increment:1},nextAttemptAt:new Date(+now+60000)}});
      if(!claimed.count)continue;
      const text=`[Cost Observer] ${alert.project.name}: ${alert.message}`.slice(0,1900);
      try{
        if(channel==='webhook')await send(process.env.NOTIFY_WEBHOOK_URL!,{id:alert.id,kind:alert.kind,project:alert.project.name,message:alert.message,createdAt:alert.createdAt});
        if(channel==='discord')await send(process.env.DISCORD_WEBHOOK_URL??process.env.NOTIFY_WEBHOOK_URL!,{content:text,allowed_mentions:{parse:[]}});
        if(channel==='telegram')await send(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,{chat_id:process.env.TELEGRAM_CHAT_ID,text,link_preview_options:{is_disabled:true}},true);
        if(channel==='email')await mail({from:process.env.SMTP_FROM!,to:process.env.SMTP_TO!,subject:`Cost Observer: ${alert.kind}`,text:`${text}\n\nEvent ID: ${alert.id}\nEstimates are not invoice totals. No Railway service was changed.`});
        await db.delivery.update({where:{id:delivery.id},data:{deliveredAt:new Date(),lastError:null}});
      }catch{
        await db.delivery.update({where:{id:delivery.id},data:{lastError:'DELIVERY_FAILED',nextAttemptAt:new Date(Date.now()+Math.min(3600,60*2**delivery.attempts)*1000)}});
      }
    }
    const deliveries=await db.delivery.findMany({where:{alertId:alert.id,channel:{in:channels}}});
    await db.alert.update({where:{id:alert.id},data:{deliveredAt:deliveries.length===channels.length&&deliveries.every(d=>d.deliveredAt)?new Date():null,deliveryAttempts:Math.max(...deliveries.map(d=>d.attempts)),nextAttemptAt:new Date(Math.min(...deliveries.map(d=>+d.nextAttemptAt)))}});
  }
}
