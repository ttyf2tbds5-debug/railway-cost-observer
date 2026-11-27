import {randomBytes} from 'node:crypto';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
mkdirSync('data',{recursive:true});
if(existsSync('.env')){console.log('Existing .env preserved. Run npm run db:deploy.');process.exit(0);}
const database=`file:${resolve('data/cost-observer.db').replaceAll('\\','/')}`;
writeFileSync('.env',`DATABASE_URL="${database}"\nAPP_URL="http://localhost:3000"\nADMIN_TOKEN="${randomBytes(32).toString('hex')}"\nENCRYPTION_KEY="${randomBytes(32).toString('hex')}"\nVIEWER_TOKEN="${randomBytes(32).toString('hex')}"\nNEXT_TELEMETRY_DISABLED=1\n`,{mode:0o600,flag:'wx'});
console.log('Created local .env with random installation secrets. Read ADMIN_TOKEN there to sign in. Do not share or commit this file. Run npm run db:deploy, then npm run dev.');
