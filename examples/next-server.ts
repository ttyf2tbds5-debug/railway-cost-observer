// Server-side only. Never prefix the token environment variable with NEXT_PUBLIC_.
export async function getCostSummary() {
  const token=process.env.COST_OBSERVER_TOKEN;
  if(!token)throw new Error('COST_OBSERVER_TOKEN is required');
  const url=new URL('/api/v1/dashboard',process.env.COST_OBSERVER_URL??'http://localhost:3000');
  const response=await fetch(url,{headers:{Authorization:`Bearer ${token}`},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error(`Cost Observer HTTP ${response.status}`);
  return response.json();
}
