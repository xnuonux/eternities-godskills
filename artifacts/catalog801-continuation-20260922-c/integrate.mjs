import assert from 'node:assert/strict';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {normalizeJevReceipt} from '../../src/catalog-skill-classification.mjs';
import {loadCatalogWithContinuations} from '../../src/catalog-continuation.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url));
const dir='artifacts/catalog801-continuation-20260922-c';
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>readFile(join(root,p));
const manifestPath='artifacts/catalog801-continuations/manifest.json';
const before=await loadCatalogWithContinuations(root);
const planBytes=await read('data/quarry-intake-2026-09-21-catalog801/jev-requests.jsonl');
assert.equal(sha(planBytes),'c1274fdcf5a54a023a3415e00bb1e813073251659e85c9a004acb6efb0915edb');
const plan=planBytes.toString().trim().split(/\r?\n/).map(JSON.parse);
const manifest=JSON.parse(await read(manifestPath));
manifest.retryReceipts??=[];
const paths=new Set([...manifest.receipts,...manifest.retryReceipts].map(e=>e.path));
const added=[],excluded=[];

async function add(path){
  if(paths.has(path))return;
  const bytes=await read(path),record=JSON.parse(bytes);
  const original=plan[record.requestIndex];assert(original,'Unknown request index');
  assert.equal(record.snapshot_id,original.snapshot_id);
  const retry=record.originalRequestId!==undefined;
  if(retry){assert.equal(record.originalRequestId,original.request_id);assert([original.request_id+'-retry-1',original.request_id+'-diagnostic-1'].includes(record.request_id));}
  else assert.equal(record.request_id,original.request_id);
  assert.equal(path.split('/').at(-1),record.request_id+'.json');
  const request=retry?{...original,request_id:record.request_id}:original;
  const text=record.result.content.filter(c=>c.type==='text');assert.equal(text.length,1);
  const raw=JSON.parse(text[0].text);
  if(!raw.request_digest){
    assert.equal(raw.status,'unavailable');
    excluded.push({path,sha256:sha(bytes),reason:'Local admission refusal; no bound provider classification',providerReason:raw.reason});return;
  }
  normalizeJevReceipt(request,record);
  const entry={path,sha256:sha(bytes)};
  (retry?manifest.retryReceipts:manifest.receipts).push(entry);paths.add(path);added.push(entry);
}

// Convert a direct Service return into the existing tool-shaped evidence wrapper,
// retaining all provider-result fields and the original diagnostic source hash.
const diagnosticBytes=await read(dir+'/diagnostic-retry.json');
const diagnostic=JSON.parse(diagnosticBytes);
const normalized={request_id:diagnostic.request_id,snapshot_id:diagnostic.snapshot_id,requestIndex:27,
  originalRequestId:diagnostic.originalRequestId,receivedAt:diagnostic.receivedAt,
  diagnosticSourceSha256:sha(diagnosticBytes),diagnostics:diagnostic.diagnostics,
  result:{content:[{type:'text',text:JSON.stringify(diagnostic.result)}],isError:false}};
const retryPath=dir+'/receipts/'+normalized.request_id+'.json';
const retryBytes=JSON.stringify(normalized,null,2)+'\n';
try{assert.equal((await read(retryPath)).toString(),retryBytes);}catch(error){if(error.code!=='ENOENT')throw error;await writeFile(join(root,retryPath),retryBytes,{flag:'wx'});}
for(const sub of ['receipts','bulk-receipts']){
  const names=(await readdir(join(root,dir,sub))).filter(f=>f.endsWith('.json')).sort();
  for(const name of names)await add(dir+'/'+sub+'/'+name);
}
for(const e of excluded)if(!manifest.excluded.some(old=>old.path===e.path))manifest.excluded.push(e);
await writeFile(join(root,manifestPath),JSON.stringify(manifest,null,2)+'\n');
const after=await loadCatalogWithContinuations(root);
const report={before:before.bodyStatuses,after:after.bodyStatuses,addedReceipts:added.length,excluded,
  continuation:after.continuation,classificationComplete:after.classificationComplete};
await writeFile(join(root,dir,'integration.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
