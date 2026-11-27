import { describe,it,expect } from 'vitest';
import { costOf,forecast,anomaly,csvCell } from '../src/lib/cost';
import { encrypt,decrypt,session,validSession } from '../src/lib/security';
import { publicIPv4,safePost } from '../src/lib/notifications';
describe('resource accounting',()=>{
 it('converts 30-day CPU and memory minutes and GB egress without multiplying egress by time',()=>expect(costOf([{measurement:'CPU_USAGE',value:43200},{measurement:'MEMORY_USAGE_GB',value:43200},{measurement:'NETWORK_TX_GB',value:2},{measurement:'DISK_USAGE_GB',value:43200}])).toBeCloseTo(30.25));
 it.each([NaN,Infinity,-1])('rejects invalid metric %s',value=>expect(()=>costOf([{measurement:'CPU_USAGE',value}])).toThrow());
 it('rejects unknown metrics instead of silently understating costs',()=>expect(()=>costOf([{measurement:'NEW_RESOURCE',value:1}])).toThrow());
 it('uses exact billing period including non-calendar start',()=>expect(forecast(2,new Date('2026-11-15'),new Date('2026-12-15'),new Date('2026-11-17'))).toBe(30));
 it('does not predict from less than a day',()=>expect(forecast(2,new Date('2026-11-15'),new Date('2026-12-15'),new Date('2026-11-15T12:00:00Z'))).toBeNull());
 it('detects a rate spike and ignores a billing reset',()=>{
   const start=new Date('2026-11-01'); const rows=[0,1,2,3].map(i=>({cost:i*.1,createdAt:new Date(+start+i*3600_000),periodStart:start}));
   expect(anomaly(rows,{cost:2,createdAt:new Date(+start+4*3600_000),periodStart:start})).not.toBeNull();
   expect(anomaly(rows,{cost:2,createdAt:new Date('2026-12-01'),periodStart:new Date('2026-12-01')})).toBeNull();
 });
 it('neutralizes spreadsheet formulas and escapes quotes',()=>{expect(csvCell('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');expect(csvCell('a,b')).toBe('"a,b"');});
});
describe('credential security',()=>{
 it('round trips encrypted credentials with a randomized nonce',()=>{const a=encrypt('fixture-token');expect(a).not.toBe(encrypt('fixture-token'));expect(decrypt(a)).toBe('fixture-token');});
 it('rejects ciphertext tampering',()=>{const bytes=Buffer.from(encrypt('fixture-token'),'base64');bytes[bytes.length-1]^=1;expect(()=>decrypt(bytes.toString('base64'))).toThrow();});
 it('rejects expired and tampered sessions',()=>{const value=session(1000);expect(validSession(value,1001)).toBe(true);expect(validSession(value,1000+8*3600_000)).toBe(false);expect(validSession(value+'x',1001)).toBe(false);});
});
describe('outbound notification protection',()=>{
 it.each(['127.0.0.1','10.0.0.1','172.16.0.1','192.168.1.1','169.254.169.254','100.100.100.200','0.0.0.0','224.0.0.1','::1','::ffff:127.0.0.1','198.18.0.1','203.0.113.1'])('blocks reserved address %s',ip=>expect(publicIPv4(ip)).toBe(false));
 it('allows a global IPv4 address',()=>expect(publicIPv4('8.8.8.8')).toBe(true));
 it.each(['http://example.com','https://user:pass@example.com','https://example.com:8443'])('rejects unsafe endpoint %s before network access',async url=>await expect(safePost(url,{})).rejects.toThrow('UNSAFE_NOTIFICATION_URL'));
});
