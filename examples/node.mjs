const base=process.env.COST_OBSERVER_URL??'http://localhost:3000';
const token=process.env.COST_OBSERVER_TOKEN;
if(!token)throw new Error('Set COST_OBSERVER_TOKEN to your local viewer token');
const response=await fetch(new URL('/api/v1/dashboard',base),{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(10000),redirect:'error'});
if(!response.ok)throw new Error(`HTTP ${response.status}`);
const data=await response.json();console.log(JSON.stringify({projects:data.projects.length,estimateOnly:data.meta.estimateOnly}));
