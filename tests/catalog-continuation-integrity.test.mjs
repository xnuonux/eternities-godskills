import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,symlink} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {createClassificationRequests,buildClassifiedQueue,bindingDigest,domainChoices,model} from '../src/catalog-skill-classification.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const json=x=>JSON.stringify(x)+'\n';
const lines=xs=>xs.map(JSON.stringify).join('\n')+'\n';
const load=async root=>(await import('../src/catalog-continuation.mjs')).loadCatalogWithContinuations(root);
test('native direct evidence loads only through exact hashes and retains native identity',async t=>{
  const f=await fixture(t);
  const {createDirectRecord}=await import('../src/catalog-typesafe.mjs');
  const native=createDirectRecord(f.request,{httpStatus:200,response:{model:'jev-1.13.0',answers:{q0:{type:'choice',choice:'engineering',confidence:1,probabilities:Object.fromEntries(Object.keys(domainChoices).map(k=>[k,k==='engineering'?1:0]))}},usage:{input_tokens:100,output_tokens:20}}});
  const path='artifacts/saved/native.json',bytes=json(native);
  await writeFile(join(f.root,path),bytes);
  f.overlay.receipts=[];f.overlay.directReceipts=[{path,sha256:sha(bytes)}];
  const save=()=>writeFile(join(f.root,'artifacts/catalog801-continuations/manifest.json'),json(f.overlay));
  await save();const result=await load(f.root);
  assert.equal(result.queue[0].advisoryDomain,'engineering');assert.equal(result.queue[0].providerRoute,'typesafe-direct');
  assert.equal(result.continuation.directProviderReceipts,1);
  await writeFile(join(f.root,path),bytes+' ');await assert.rejects(load(f.root),/Changed evidence/);
  await writeFile(join(f.root,path),bytes);f.overlay.directReceipts.push({...f.overlay.directReceipts[0]});await save();
  await assert.rejects(load(f.root),/Duplicate direct receipt path/);
});
async function fixture(t){
  const root=await mkdtemp(join(tmpdir(),'gsk-continuation-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  const dir=join(root,'data/quarry-intake-2026-09-21-catalog801');
  await mkdir(join(dir,'jev-receipts'),{recursive:true});
  await mkdir(join(root,'artifacts/catalog801-continuations'),{recursive:true});
  await mkdir(join(root,'artifacts/saved'),{recursive:true});
  const body=sha('body'),text='{"name":"unique method","description":"software"}';
  const inputs=[{inputSha256:sha(text),text,providerEligible:true,bodyHashes:[body]}];
  const groups=[{bodySha256:body,sourceIds:['example/repo@abc:SKILL.md']}];
  const sources=[{sourceId:groups[0].sourceIds[0],bodySha256:body,name:'unique method',description:'software'}];
  const requests=createClassificationRequests(inputs,groups),request=requests[0];
  const queue=buildClassifiedQueue(inputs,groups,requests,[]);
  const files={'sources.jsonl':lines(sources),'body-groups.jsonl':lines(groups),'classification-inputs.jsonl':lines(inputs)};
  const manifest={outputs:Object.fromEntries(Object.entries(files).map(([p,b])=>[p,{sha256:sha(b)}]))};
  const planHash=sha(lines(requests));
  const summary={intakeManifestSha256:sha(json(manifest)),requestPlanSha256:planHash,queueSha256:sha(lines(queue)),receiptFiles:[]};
  for(const [p,b]of Object.entries({...files,'manifest.json':json(manifest),'classification-summary.json':json(summary),'refinement-queue.jsonl':lines(queue),'jev-request-plan-receipt.json':json({persistedRequestPlanSha256:planHash})}))await writeFile(join(dir,p),b);
  const raw={status:'ok',authority:'none',may_execute:false,request_digest:bindingDigest(request),snapshot_id:request.snapshot_id,returned_model:model,provider:'TypeSafe',results:{[request.items[0].id]:{status:'proposal',selected_id:'engineering',confidence:1,margin:1,probabilities:Object.fromEntries(Object.keys(domainChoices).map(k=>[k,k==='engineering'?1:0]))}}};
  const record={request_id:request.request_id,snapshot_id:request.snapshot_id,result:{content:[{type:'text',text:JSON.stringify(raw)}]}};
  const overlay={schema:'catalog-continuation-v1',intakeManifestSha256:summary.intakeManifestSha256,classificationSummarySha256:sha(json(summary)),requestPlanSha256:planHash,requestPlanReceiptSha256:sha(json({persistedRequestPlanSha256:planHash})),receipts:[{path:'artifacts/saved/receipt.json',sha256:sha(json(record))}]};
  async function save(){await writeFile(join(root,'artifacts/saved/receipt.json'),json(record));overlay.receipts[0].sha256=sha(json(record));await writeFile(join(root,'artifacts/catalog801-continuations/manifest.json'),json(overlay));}
  await save();return{root,dir,record,raw,overlay,save,summary,queue,request};
}
test('verified overlay changes only the in-memory queue and preserves the frozen input bytes',async t=>{
  const f=await fixture(t),before=await readFile(join(f.dir,'refinement-queue.jsonl'));
  const result=await load(f.root);
  assert.equal(result.queue[0].classificationStatus,'jev-provisional');assert.equal(result.queue[0].advisoryDomain,'engineering');
  assert.equal(result.queue[0].activation,'none');assert.equal(result.queue[0].reviewStatus,'body-unreviewed');
  assert.deepEqual(await readFile(join(f.dir,'refinement-queue.jsonl')),before);
});
test('tampered receipt bytes, intake bindings and frozen queue cannot be accepted',async t=>{
  for(const mutation of ['receipt','binding','queue','plan-receipt'])await t.test(mutation,async t=>{
    const f=await fixture(t);
    if(mutation==='receipt')await writeFile(join(f.root,'artifacts/saved/receipt.json'),'{}');
    if(mutation==='binding'){f.overlay.requestPlanSha256='0'.repeat(64);await f.save();}
    if(mutation==='queue')await writeFile(join(f.dir,'refinement-queue.jsonl'),'{}\n');
    if(mutation==='plan-receipt')await writeFile(join(f.dir,'jev-request-plan-receipt.json'),json({persistedRequestPlanSha256:f.summary.requestPlanSha256,requiredReturnedModel:'foreign'}));
    await assert.rejects(load(f.root),{code:'ERR_ASSERTION'});
  });
});
test('unknown requests, duplicates and local refusals do not produce labels',async t=>{
  for(const mutation of ['unknown','duplicate','paced','inner-binding'])await t.test(mutation,async t=>{
    const f=await fixture(t);
    if(mutation==='unknown')f.record.request_id='foreign';
    if(mutation==='duplicate')f.overlay.receipts.push({...f.overlay.receipts[0]});
    if(mutation==='paced')f.record.result.content[0].text=JSON.stringify({status:'unavailable',reason:'paced',authority:'none',may_execute:false});
    if(mutation==='inner-binding'){f.raw.request_digest='0'.repeat(64);f.record.result.content[0].text=JSON.stringify(f.raw);}
    await f.save();await assert.rejects(load(f.root),{code:'ERR_ASSERTION'});
  });
});
test('bound unavailable receipts remain unavailable rather than a domain proposal',async t=>{
  const f=await fixture(t);f.raw.status='unavailable';f.raw.reason='distribution-sum';delete f.raw.results;delete f.raw.returned_model;delete f.raw.provider;f.record.result.content[0].text=JSON.stringify(f.raw);await f.save();
  const result=await load(f.root);assert.equal(result.queue[0].classificationStatus,'jev-unavailable');assert.equal(result.queue[0].advisoryDomain,null);
});
test('hash-bound retry overlay preserves the failed receipt and refuses altered or linked retry evidence',async t=>{
  const f=await fixture(t);
  const retryRequest={...f.request,request_id:f.request.request_id+'-retry-1'};
  const retryRaw={...f.raw,request_digest:bindingDigest(retryRequest)};
  const retryRecord={request_id:retryRequest.request_id,snapshot_id:retryRequest.snapshot_id,originalRequestId:f.request.request_id,result:{content:[{type:'text',text:JSON.stringify(retryRaw)}]}};
  f.raw.status='unavailable';f.raw.reason='distribution-sum';delete f.raw.results;
  f.record.result.content[0].text=JSON.stringify(f.raw);
  const retryPath='artifacts/saved/retry.json',retryBytes=json(retryRecord);
  await writeFile(join(f.root,retryPath),retryBytes);
  f.overlay.retryReceipts=[{path:retryPath,sha256:sha(retryBytes)}];await f.save();
  const failureBefore=await readFile(join(f.root,'artifacts/saved/receipt.json'));
  const result=await load(f.root);
  assert.equal(result.queue[0].classificationStatus,'jev-provisional');
  assert.equal(result.queue[0].priorRequestId,f.request.request_id);
  assert.equal(result.continuation.retryProviderReceipts,1);
  assert.equal(result.continuation.inputStatuses['jev-unavailable'],1);
  assert.deepEqual(await readFile(join(f.root,'artifacts/saved/receipt.json')),failureBefore);
  await writeFile(join(f.root,retryPath),retryBytes+' ');
  await assert.rejects(load(f.root),/Changed evidence/);
  await writeFile(join(f.root,retryPath),retryBytes);
  f.overlay.retryReceipts.push({...f.overlay.retryReceipts[0]});await f.save();
  await assert.rejects(load(f.root),/Duplicate retry receipt path/);
  f.overlay.retryReceipts=[{path:'../retry.json',sha256:sha(retryBytes)}];await f.save();
  await assert.rejects(load(f.root),/Retry receipt outside artifacts/);
  await mkdir(join(f.root,'retry-elsewhere'));await writeFile(join(f.root,'retry-elsewhere/retry.json'),retryBytes);
  await symlink(join(f.root,'retry-elsewhere'),join(f.root,'artifacts/retry-link'),'junction');
  f.overlay.retryReceipts=[{path:'artifacts/retry-link/retry.json',sha256:sha(retryBytes)}];await f.save();
  await assert.rejects(load(f.root),/Linked evidence path/);
});
test('unavailable receipts cannot contradict the bound provider or model',async t=>{
  for(const field of ['provider','returned_model'])await t.test(field,async t=>{
    const f=await fixture(t);f.raw.status='unavailable';f.raw.reason='distribution-sum';delete f.raw.results;f.raw[field]='foreign';f.record.result.content[0].text=JSON.stringify(f.raw);await f.save();
    await assert.rejects(load(f.root),{code:'ERR_ASSERTION'});
  });
});
test('artifact paths cannot escape through traversal, absolute paths or a junction',async t=>{
  for(const path of ['../receipt.json','C:/receipt.json','artifacts/../secret.json','artifacts/saved\\receipt.json'])await t.test(path,async t=>{
    const f=await fixture(t);f.overlay.receipts[0].path=path;await f.save();await assert.rejects(load(f.root),{code:'ERR_ASSERTION'});
  });
  await t.test('junction',async t=>{const f=await fixture(t);await mkdir(join(f.root,'elsewhere'));await writeFile(join(f.root,'elsewhere/receipt.json'),json(f.record));await symlink(join(f.root,'elsewhere'),join(f.root,'artifacts/link'),'junction');f.overlay.receipts[0].path='artifacts/link/receipt.json';await f.save();await assert.rejects(load(f.root),{code:'ERR_ASSERTION'});});
});
test('duplicate request in a second file or already in the base is rejected',async t=>{
  for(const location of ['overlay','original'])await t.test(location,async t=>{
    const f=await fixture(t);
    if(location==='overlay'){
      await writeFile(join(f.root,'artifacts/saved/duplicate.json'),json(f.record));
      f.overlay.receipts.push({path:'artifacts/saved/duplicate.json',sha256:sha(json(f.record))});
    }else{
      const inputs=[...JSON.parse('['+(await readFile(join(f.dir,'classification-inputs.jsonl'),'utf8')).trim()+']')];
      const groups=[...JSON.parse('['+(await readFile(join(f.dir,'body-groups.jsonl'),'utf8')).trim()+']')];
      const queue=buildClassifiedQueue(inputs,groups,createClassificationRequests(inputs,groups),[f.record]);
      await writeFile(join(f.dir,'jev-receipts/first.json'),json(f.record));
      f.summary.receiptFiles=[{path:'jev-receipts/first.json',sha256:sha(json(f.record))}];
      f.summary.queueSha256=sha(lines(queue));await writeFile(join(f.dir,'refinement-queue.jsonl'),lines(queue));
      await writeFile(join(f.dir,'classification-summary.json'),json(f.summary));f.overlay.classificationSummarySha256=sha(json(f.summary));
    }
    await f.save();await assert.rejects(load(f.root),/Duplicate provider receipt/);
  });
});
