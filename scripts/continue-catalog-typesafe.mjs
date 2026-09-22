// Owner-authorized selected-public-metadata continuation. No provider fallback.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,readdir,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import {loadCatalogWithContinuations} from '../src/catalog-continuation.mjs';
import {directEndpoint,dispatchDirectOnce} from '../src/catalog-typesafe.mjs';
const root=resolve(import.meta.dirname,'..');
const output=join(root,'artifacts/catalog801-typesafe-direct-20260922');
await mkdir(join(output,'receipts'),{recursive:true});
assert(!process.argv.slice(2).length,'No alternate endpoint, model, or identity flags');
assert(process.env.TYPESAFE_API_KEY,'Missing direct TypeSafe credential');
const planBytes=await readFile(join(root,'data/quarry-intake-2026-09-21-catalog801/jev-requests.jsonl'));
assert.equal(createHash('sha256').update(planBytes).digest('hex'),'c1274fdcf5a54a023a3415e00bb1e813073251659e85c9a004acb6efb0915edb');
const requests=planBytes.toString().trim().split(/\r?\n/).map(JSON.parse);
const catalog=await loadCatalogWithContinuations(root);
const never=new Set(catalog.queue.filter(r=>r.classificationStatus==='not-dispatched').map(r=>r.inputSha256));
const selected=requests.map((request,index)=>({request,index})).filter(({request})=>request.items.every(i=>never.has(i.id.slice(2))));
assert(!(await readdir(join(output,'receipts'))).some(p=>p.endsWith('.pending')),'Unsettled native attempt requires inspection');
const totals={planned:selected.length,attempted:0,ok:0,unavailable:0,networkCalls:0,stop:null};
async function transport(wire){
  totals.networkCalls++;
  const response=await fetch(directEndpoint,{method:'POST',redirect:'error',signal:AbortSignal.timeout(20000),headers:{Authorization:`Bearer ${process.env.TYPESAFE_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(wire)});
  if(response.status!==200){await response.body?.cancel();return{httpStatus:response.status};}
  const reader=response.body.getReader(),chunks=[];let size=0;
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>131072){await reader.cancel();throw Error('Oversized response');}chunks.push(value);}
  return{httpStatus:200,response:JSON.parse(Buffer.concat(chunks).toString('utf8'))};
}
for(const {request,index} of selected){
  const result=await dispatchDirectOnce(request,join(output,'receipts'),transport);
  totals.attempted++;totals[result.status]++;
  if(result.status==='unavailable'&&result.reason!=='invalid-provider-response')totals.stop=result.reason;
  const status={...totals,lastSourceIndex:index,updatedAt:new Date().toISOString(),classificationComplete:false};
  await writeFile(join(output,'status.json.tmp'),JSON.stringify(status,null,2)+'\n');
  await rename(join(output,'status.json.tmp'),join(output,'status.json'));
  if(totals.attempted%25===0||totals.stop)console.log(JSON.stringify(status));
  if(totals.stop)break;
}
console.log(JSON.stringify({finished:true,...totals}));
