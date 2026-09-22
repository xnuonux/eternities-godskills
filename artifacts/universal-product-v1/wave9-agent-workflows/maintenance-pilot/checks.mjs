import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile,writeFile,mkdir,mkdtemp,cp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const sha=b=>createHash('sha256').update(b).digest('hex');
const json=x=>JSON.stringify(x)+'\n';
const lines=xs=>xs.map(JSON.stringify).join('\n')+'\n';
const here=fileURLToPath(new URL('.',import.meta.url));
function run(root,args){return spawnSync(process.execPath,[join(root,'scripts/query-catalog-skill-intake.mjs'),...args],{encoding:'utf8',timeout:10000,maxBuffer:1024*1024});}
function success(r){assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout);}
function failure(r){assert.notEqual(r.status,null,'Run unavailable or timed out');assert.notEqual(r.status,0);assert.equal(r.stdout.trim(),'');}

// Real loader and bound synthetic data. Expectations are literal; no candidate
// summary builder computes them. Trusted baseline supplies only fixture encoding.
async function fixture(candidate,baselineModule){
  const root=await mkdtemp(join(tmpdir(),'gsk-summary-check-'));
  await cp(join(candidate,'src'),join(root,'src'),{recursive:true});
  await cp(join(candidate,'scripts'),join(root,'scripts'),{recursive:true});
  const {createClassificationRequests,buildClassifiedQueue,bindingDigest,domainChoices,model}=baselineModule;
  const dir=join(root,'data/quarry-intake-2026-09-21-catalog801');
  await mkdir(dir,{recursive:true});await mkdir(join(root,'artifacts/catalog801-continuations'),{recursive:true});await mkdir(join(root,'artifacts/saved'),{recursive:true});
  const bodies=[sha('eligible'),sha('excluded')];
  const inputs=[{inputSha256:sha('alpha'),text:'alpha',providerEligible:true,bodyHashes:[bodies[0]]},{inputSha256:sha('beta'),text:'beta',providerEligible:false,bodyHashes:[bodies[1]],exclusion:'fixture'}];
  const groups=[{bodySha256:bodies[0],sourceIds:['a/repo@abc:one','a/repo@abc:alias']},{bodySha256:bodies[1],sourceIds:['b/repo@abc:two']}];
  const sources=groups.flatMap(g=>g.sourceIds.map(sourceId=>({sourceId,bodySha256:g.bodySha256,name:'fixture',description:'fixture'})));
  const requests=createClassificationRequests(inputs,groups),request=requests[0],queue=buildClassifiedQueue(inputs,groups,requests,[]);
  const files={'sources.jsonl':lines(sources),'body-groups.jsonl':lines(groups),'classification-inputs.jsonl':lines(inputs)};
  const manifest={outputs:Object.fromEntries(Object.entries(files).map(([p,b])=>[p,{sha256:sha(b)}]))};
  const planHash=sha(lines(requests)),plan={persistedRequestPlanSha256:planHash};
  const summary={intakeManifestSha256:sha(json(manifest)),requestPlanSha256:planHash,queueSha256:sha(lines(queue)),receiptFiles:[]};
  for(const [p,b]of Object.entries({...files,'manifest.json':json(manifest),'classification-summary.json':json(summary),'refinement-queue.jsonl':lines(queue),'jev-request-plan-receipt.json':json(plan)}))await writeFile(join(dir,p),b);
  const raw={status:'ok',authority:'none',may_execute:false,request_digest:bindingDigest(request),snapshot_id:request.snapshot_id,returned_model:model,provider:'TypeSafe',results:{[request.items[0].id]:{status:'proposal',selected_id:'engineering',confidence:1,margin:1,probabilities:Object.fromEntries(Object.keys(domainChoices).map(k=>[k,k==='engineering'?1:0]))}}};
  const receipt={request_id:request.request_id,snapshot_id:request.snapshot_id,result:{content:[{type:'text',text:JSON.stringify(raw)}]}};
  const overlay={schema:'catalog-continuation-v1',intakeManifestSha256:summary.intakeManifestSha256,classificationSummarySha256:sha(json(summary)),requestPlanSha256:planHash,requestPlanReceiptSha256:sha(json(plan)),receipts:[{path:'artifacts/saved/receipt.json',sha256:sha(json(receipt))}]};
  await writeFile(join(root,'artifacts/saved/receipt.json'),json(receipt));await writeFile(join(root,'artifacts/catalog801-continuations/manifest.json'),json(overlay));
  return{root,dir};
}

export async function evaluate(candidate,baselineModule){
  const expected=JSON.parse(await readFile(join(here,'expected-query.json'),'utf8')),counts=JSON.parse(await readFile(join(here,'expected-counts.json'),'utf8'));
  const checks=[];
  async function check(name,fn){try{await fn();checks.push({name,pass:true});}catch(e){checks.push({name,pass:false,error:String(e.message).slice(0,900)});}}
  await check('verified real summary without source payload',()=>{
    const out=success(run(candidate,['--summary']));
    const want={...expected};delete want.results;
    assert.deepEqual(out,{...want,mode:'summary',...counts,authority:'none',activation:'none'});
  });
  await check('legacy query and rejection behavior unchanged',()=>{
    assert.deepEqual(success(run(candidate,['--query','devtools-vue','--domain','engineering'])),expected);
    for(const args of [[],['--query',''],['--query','x','--limit','6'],['--query','x','--domain','invalid']])failure(run(candidate,args));
  });
  await check('summary arguments are exclusive',()=>{
    for(const args of [['--summary','--query','x'],['--query','x','--summary'],['--summary','--domain','engineering'],['--limit','2','--summary'],['--summary','--summary'],['--summary','yes'],['--summary','--wat'],['--wat']])failure(run(candidate,args));
  });
  const f=await fixture(candidate,baselineModule);
  try{
    await check('different valid evidence is counted, not hardcoded',()=>{
      const out=success(run(f.root,['--summary']));
      assert.equal(out.sourceCount,3);assert.equal(out.uniqueBodyCount,2);
      assert.deepEqual(out.bodyStatuses,{'jev-provisional':1,'excluded-selected-metadata':1});
      assert.equal(out.continuation.providerReceipts,1);assert.deepEqual(out.continuation.inputStatuses,{'jev-provisional':1});
      assert.equal(out.classificationComplete,false);assert.equal(out.authority,'none');assert.equal(out.activation,'none');
      assert(!('results'in out||'sources'in out||'queue'in out));
    });
    await check('corrupted provider receipt rejected',async()=>{
      const path=join(f.root,'artifacts/saved/receipt.json'),before=await readFile(path);
      try{await writeFile(path,'{}');failure(run(f.root,['--summary']));}finally{await writeFile(path,before);}
    });
    await check('corrupted frozen queue rejected',async()=>{
      await writeFile(join(f.dir,'refinement-queue.jsonl'),'{}\n');failure(run(f.root,['--summary']));
    });
  }finally{await rm(f.root,{recursive:true,force:true});}
  return{status:'executed-checks',checks,passed:checks.filter(c=>c.pass).length,total:checks.length};
}
