import {it,expect} from 'vitest';
import {resourceInsights} from '../src/lib/insights';
const start=new Date('2026-11-01'),end=new Date('2026-11-03');
it('explains low CPU, egress share and retention opportunities from service-level evidence',()=>{
 const result=resourceInsights([{measurement:'CPU_USAGE',value:10,tags:{serviceId:'one'}},{measurement:'MEMORY_USAGE_GB',value:2880,tags:{serviceId:'one'}},{measurement:'NETWORK_TX_GB',value:100,tags:{serviceId:'one'}},{measurement:'DISK_USAGE_GB',value:30000,tags:{serviceId:'one'}}],start,end);
 expect(result.map(x=>x.code)).toEqual(['LOW_AVERAGE_CPU','EGRESS_COST_SHARE','STORAGE_REVIEW']);expect(result.every(x=>x.automaticAction===false)).toBe(true);expect(result[0].evidence.averageMemoryGB).toBe(1);
});
it('does not recommend stopping fresh or busy services',()=>{
 expect(resourceInsights([],start,new Date(+start+3600000))).toEqual([]);
 expect(resourceInsights([{measurement:'CPU_USAGE',value:2880,tags:{serviceId:'one'}},{measurement:'MEMORY_USAGE_GB',value:2880,tags:{serviceId:'one'}}],start,end)).toEqual([]);
});
