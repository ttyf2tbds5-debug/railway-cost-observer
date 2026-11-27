// Uses only health metadata. No Railway CLI, service provisioning or paid API call.
const base=process.env.COST_OBSERVER_URL??'http://localhost:3000';
const response=await fetch(new URL('/api/ready',base),{signal:AbortSignal.timeout(10000),redirect:'error'});
if(!response.ok)throw new Error(`Installation not ready: HTTP ${response.status}`);
console.log(await response.json());
