import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const lock=JSON.parse(readFileSync('package-lock.json','utf8'));
const entries=[];
for(const [location,metadata] of Object.entries(lock.packages??{})){
 if(!location)continue;
 try{const pkg=JSON.parse(readFileSync(`${location}/package.json`,'utf8'));entries.push({name:pkg.name,version:pkg.version,license:typeof pkg.license==='string'?pkg.license:pkg.license?.type??'REVIEW_REQUIRED',developmentOnly:!!metadata.dev});}
 catch{entries.push({name:location,version:metadata.version,license:metadata.license??'NOT_INSTALLED_ON_THIS_PLATFORM',developmentOnly:!!metadata.dev});}
}
entries.sort((a,b)=>a.name.localeCompare(b.name));mkdirSync('docs',{recursive:true});writeFileSync('docs/dependency-licenses.json',JSON.stringify({note:'Manifest inventory, not legal clearance. Preserve upstream license notices when redistributing dependencies.',entries},null,2));
const counts={};for(const entry of entries)counts[entry.license]=(counts[entry.license]??0)+1;
console.log(JSON.stringify(counts));
