import assert from 'node:assert/strict';
import {readFile,writeFile,readdir,rename} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {loadCatalogWithContinuations} from '../src/catalog-continuation.mjs';
import {applyDirectReceipts,directIdentity} from '../src/catalog-typesafe.mjs';
const root=resolve(import.meta.dirname,'..'),folder='artifacts/catalog801-typesafe-direct-20260922/receipts';
const manifestPath=join(root,'artifacts/catalog801-continuations/manifest.json');
const before=await loadCatalogWithContinuations(root),manifest=JSON.parse(await readFile(manifestPath,'utf8'));
const planBytes=await readFile(join(root,'data/quarry-intake-2026-09-21-catalog801/jev-requests.jsonl'));
assert.equal(createHash('sha256').update(planBytes).digest('hex'),'c1274fdcf5a54a023a3415e00bb1e813073251659e85c9a004acb6efb0915edb');
const requests=planBytes.toString().trim().split(/\r?\n/).map(JSON.parse),sources=new Map(requests.map(r=>[r.request_id,r]));
manifest.directReceipts??=[];const paths=new Set(manifest.directReceipts.map(e=>e.path)),newRecords=[];
const names=await readdir(join(root,folder));assert(!names.some(n=>n.endsWith('.pending')),'Unsettled call');
for(const name of names.filter(n=>n.endsWith('.json')).sort()){
  const path=folder+'/'+name;if(paths.has(path))continue;
  const bytes=await readFile(join(root,path)),record=JSON.parse(bytes),source=sources.get(record.sourceRequestId);
  assert(source);assert.equal(name,directIdentity(source)+'.json');newRecords.push(record);
  manifest.directReceipts.push({path,sha256:createHash('sha256').update(bytes).digest('hex')});
}
applyDirectReceipts(before.queue,requests,newRecords);
await writeFile(manifestPath+'.tmp',JSON.stringify(manifest,null,2)+'\n');await rename(manifestPath+'.tmp',manifestPath);
const after=await loadCatalogWithContinuations(root);
const report={addedReceipts:newRecords.length,bodyStatuses:after.bodyStatuses,continuation:after.continuation,classificationComplete:after.classificationComplete};
await writeFile(join(root,'artifacts/catalog801-typesafe-direct-20260922/integration.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
