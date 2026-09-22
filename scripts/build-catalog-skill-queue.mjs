import assert from 'node:assert/strict';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {buildClassifiedQueue,normalizeJevReceipt,createClassificationRequests,classificationsComplete} from '../src/catalog-skill-classification.mjs';
import {verifySourceAccounting} from '../src/catalog-skill-intake.mjs';
const dir=fileURLToPath(new URL('../data/quarry-intake-2026-09-21-catalog801/',import.meta.url));
const sha=x=>createHash('sha256').update(x).digest('hex');
const read=async name=>(await readFile(dir+name,'utf8')).trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
const manifest=JSON.parse(await readFile(dir+'manifest.json','utf8'));
for(const [name,evidence]of Object.entries(manifest.outputs))assert.equal(sha(await readFile(dir+name)),evidence.sha256,`Changed intake: ${name}`);
const inputs=await read('classification-inputs.jsonl'),groups=await read('body-groups.jsonl'),requests=createClassificationRequests(inputs,groups);
const requestBytes=requests.map(x=>JSON.stringify(x)).join('\n')+'\n';
const planEvidence=JSON.parse(await readFile(dir+'jev-request-plan-receipt.json','utf8'));
assert.equal(sha(requestBytes),planEvidence.persistedRequestPlanSha256,'Request plan differs from dispatched artifact');
try{assert.equal(sha(await readFile(dir+'jev-requests.jsonl')),planEvidence.persistedRequestPlanSha256,'Changed local request-plan bytes');}catch(e){if(e.code!=='ENOENT')throw e;}
const sources=await read('sources.jsonl'),excluded=JSON.parse(await readFile(dir+'excluded-entries.json','utf8'));
const sourceAccountingComplete=verifySourceAccounting(sources,groups,excluded,manifest.counts.declaredEntrypoints);
const receiptFiles=(await readdir(dir+'jev-receipts')).filter(x=>x.endsWith('.json')&&!x.endsWith('.attempt.json')).sort();
const receipts=await Promise.all(receiptFiles.map(async x=>JSON.parse(await readFile(dir+'jev-receipts/'+x,'utf8'))));
const queue=buildClassifiedQueue(inputs,groups,requests,receipts),count=(xs,key)=>Object.fromEntries([...new Set(xs.map(x=>x[key]??'unassigned'))].sort().map(k=>[k,xs.filter(x=>(x[key]??'unassigned')===k).length]));
const requestMap=new Map(requests.map(x=>[x.request_id,x]));
const inputLabels=receipts.flatMap(r=>normalizeJevReceipt(requestMap.get(r.request_id),r).labels);
const summary={schemaVersion:'catalog-skill-classification-v1',intakeManifestSha256:sha(await readFile(dir+'manifest.json')),
  requestPlanSha256:sha(requests.map(x=>JSON.stringify(x)).join('\n')+'\n'),plannedRequests:requests.length,completedProviderReceipts:receipts.length,
  successfulProviderBatches:receipts.filter(r=>JSON.parse(r.result.content[0].text).status==='ok').length,
  inputStatuses:count(inputLabels,'classificationStatus'),bodyStatuses:count(queue,'classificationStatus'),advisoryDomains:count(queue,'advisoryDomain'),
  accountedMicrousd:receipts.reduce((n,r)=>n+(JSON.parse(r.result.content[0].text).accounted_microusd??0),0),
  scope:'Metadata triage only. No source body quality, license, safety, equivalence or product promotion established.',
  classificationComplete:classificationsComplete(queue),sourceAccountingComplete,
  productSkillsChanged:0,activation:'none',receiptFiles:await Promise.all(receiptFiles.map(async name=>({path:`jev-receipts/${name}`,sha256:sha(await readFile(dir+'jev-receipts/'+name))})))};
const queueBytes=queue.map(x=>JSON.stringify(x)).join('\n')+'\n';summary.queueSha256=sha(queueBytes);summary.bodies=queue.length;
async function preserveOutput(name,text){try{assert.equal(await readFile(dir+name,'utf8'),text,`Refusing to replace existing evidence: ${name}`);}catch(e){if(e.code!=='ENOENT')throw e;await writeFile(dir+name,text,{flag:'wx'});}}
await preserveOutput('refinement-queue.jsonl',queueBytes);
await preserveOutput('classification-summary.json',JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({...summary,receiptFiles:undefined},null,2));
