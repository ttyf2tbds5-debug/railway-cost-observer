import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {PrismaClient} from '@prisma/client';
const env=readFileSync('.env','utf8');
const token=env.match(/^ADMIN_TOKEN="([^"]+)"/m)![1];
const viewer=env.match(/^VIEWER_TOKEN="([^"]+)"/m)![1];
test('protects APIs, rejects cross-origin login and prevents viewer changes',async({request})=>{
 expect((await request.get('/api/v1/dashboard')).status()).toBe(401);
 expect((await request.post('/api/auth',{headers:{Origin:'https://attacker.invalid'},data:{token}})).status()).toBe(403);
 expect((await request.post('/api/v1/connections',{headers:{Authorization:`Bearer ${viewer}`},data:{}})).status()).toBe(403);
 expect((await request.get('/api/ready')).status()).toBe(200);
});
test('logs in, displays empty onboarding, validates and persists a connection, then removes it',async({page})=>{
 await page.goto('/');await page.getByLabel('Admin access token').fill(token);await page.getByRole('button',{name:'Open workspace'}).click();
 await expect(page.getByRole('heading',{name:'Every project. One clear view.'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Bring your Railway projects into view.'})).toBeVisible();
 await page.screenshot({path:'test-results/overview-empty.png',fullPage:true});
 await page.getByRole('button',{name:'Connect your first workspace'}).click();
 await page.getByLabel('Workspace label').fill('E2E fixture');await page.getByLabel('Railway workspace ID').fill('00000000-0000-4000-8000-000000000001');await page.getByLabel('Account or workspace API token').fill('fixture-only-never-use-for-live-railway');
 await page.getByRole('button',{name:'Save connection'}).click();
 await expect(page.getByRole('heading',{name:'E2E fixture'})).toBeVisible();await page.reload();await page.getByRole('button',{name:'Connections',exact:true}).click();await expect(page.getByRole('heading',{name:'E2E fixture'})).toBeVisible();
 page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Remove connection'}).click();await expect(page.getByText('No connected workspaces. Add your first one above.')).toBeVisible();
 await page.getByRole('button',{name:'Sign out'}).click();await expect(page.getByLabel('Admin access token')).toBeVisible();
});
test('mobile login fits without horizontal overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await expect(page.getByLabel('Admin access token')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/mobile-login.png',fullPage:true});
});
test('populated synthetic dashboard supports chart, budget, alerts, export and light mode',async({page,request})=>{
 const database=env.match(/^DATABASE_URL="([^"]+)"/m)![1];const db=new PrismaClient({datasourceUrl:database});
 const connection=await db.connection.create({data:{name:'Synthetic test workspace',workspaceId:'00000000-0000-4000-8000-000000000002',token:'not-a-usable-encrypted-token'}});
 try{
   const start=new Date('2026-11-01');
   await db.project.create({data:{id:'e2e-synthetic-project',name:'Synthetic API',connectionId:connection.id,budget:50,snapshots:{create:Array.from({length:8},(_,i)=>({createdAt:new Date(+start+(i+1)*86400_000),periodStart:start,periodEnd:new Date('2026-12-01'),cost:4+i*1.3,forecast:45,metrics:JSON.stringify([{measurement:'CPU_USAGE',value:1200},{measurement:'MEMORY_USAGE_GB',value:3100},{measurement:'NETWORK_TX_GB',value:.8}])}))},alerts:{create:{kind:'forecast',message:'Synthetic projection exceeds the test budget.',dedupeKey:'e2e-alert'}}}});
   await page.goto('/');await page.getByLabel('Admin access token').fill(token);await page.getByRole('button',{name:'Open workspace'}).click();
   await expect(page.getByRole('img',{name:/Cumulative estimated usage/})).toBeVisible();
   await page.getByLabel('Synthetic API budget',{exact:true}).fill('75');await page.getByRole('button',{name:'Save Synthetic API budget'}).click();
   await expect.poll(async()=>(await db.project.findUnique({where:{id:'e2e-synthetic-project'}}))?.budget).toBe(75);
   await page.getByRole('button',{name:'Rules for Synthetic API'}).click();
   await page.getByLabel('Anomaly multiplier').fill('4');
   await page.getByRole('button',{name:'Save rules'}).click();
   await expect.poll(async()=>(await db.project.findUnique({where:{id:'e2e-synthetic-project'}}))?.anomalyMultiplier).toBe(4);
   await page.screenshot({path:'test-results/overview-synthetic.png',fullPage:true});
   await page.getByRole('button',{name:'Alerts',exact:false}).first().click();await page.getByRole('button',{name:'Mark reviewed'}).click();await expect(page.getByText('Reviewed',{exact:true})).toBeVisible();
   const csv=await request.get('/api/v1/export',{headers:{Authorization:`Bearer ${viewer}`}});expect(csv.status()).toBe(200);expect(await csv.text()).toContain('Synthetic API');
   await page.getByRole('button',{name:'Overview',exact:true}).click();await page.getByRole('button',{name:'Switch to light mode'}).click();await page.screenshot({path:'test-results/overview-light-synthetic.png',fullPage:true});
   await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/mobile-overview-synthetic.png',fullPage:true});
 }finally{await db.connection.delete({where:{id:connection.id}});await db.$disconnect();}
});
test('connection dialog traps keyboard focus and closes with Escape',async({page})=>{
 await page.goto('/');await page.getByLabel('Admin access token').fill(token);await page.getByRole('button',{name:'Open workspace'}).click();
 await page.getByRole('button',{name:'Connect workspace',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Connect a workspace'});await expect(dialog).toBeVisible();
 for(let i=0;i<8;i++){await page.keyboard.press('Tab');expect(await dialog.evaluate(el=>el.contains(document.activeElement))).toBe(true);}
 await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(page.getByRole('button',{name:'Connect workspace',exact:true})).toBeFocused();
});
