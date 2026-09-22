import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as classifier from '../src/catalog-skill-classification.mjs';
const sha=s=>createHash('sha256').update(s).digest('hex');

function fixture(){
  const text='Public software skill metadata';
  const inputs=[{inputSha256:sha(text),text,providerEligible:true,bodyHashes:[sha('body')]}];
  const groups=[{bodySha256:sha('body'),sourceIds:['example/repo@abc:SKILL.md']}];
  const requests=classifier.createClassificationRequests(inputs,groups),original=requests[0];
  const wrap=(request,raw)=>({request_id:request.request_id,snapshot_id:request.snapshot_id,result:{content:[{type:'text',text:JSON.stringify({authority:'none',may_execute:false,request_digest:classifier.bindingDigest(request),snapshot_id:request.snapshot_id,...raw})}]}});
  const failed=wrap(original,{status:'unavailable',reason:'distribution-sum'});
  const queue=classifier.buildClassifiedQueue(inputs,groups,requests,[failed]);
  const retry={...original,request_id:original.request_id+'-retry-1'};
  const record={...wrap(retry,{status:'ok',returned_model:classifier.model,provider:'TypeSafe',results:{[retry.items[0].id]:{status:'proposal',selected_id:'engineering',confidence:1,margin:1,probabilities:Object.fromEntries(Object.keys(classifier.domainChoices).map(k=>[k,k==='engineering'?1:0]))}}}),originalRequestId:original.request_id};
  return{queue,requests,record,retry};
}

test('successful retry replaces only failed advisory labels and preserves failure lineage',()=>{
  const f=fixture(),before=JSON.stringify(f.queue);
  const result=classifier.applyClassificationRetries(f.queue,f.requests,[f.record]);
  assert.equal(result[0].classificationStatus,'jev-provisional');
  assert.equal(result[0].advisoryDomain,'engineering');
  assert.equal(result[0].reason,null);
  assert.equal(result[0].priorRequestId,f.requests[0].request_id);
  assert.equal(result[0].priorReceiptDigest,f.queue[0].receiptDigest);
  assert.equal(result[0].requestId,f.retry.request_id);
  assert.equal(result[0].activation,'none');assert.equal(result[0].authority,'none');
  assert.equal(result[0].reviewStatus,'body-unreviewed');
  assert.equal(JSON.stringify(f.queue),before);
});

test('retry cannot overwrite success, an undispatched item, a refusal or uncertainty',()=>{
  for(const mutation of ['success','undispatched','paced','transport-uncertain','wrong-original']){
    const f=fixture();
    if(mutation==='success')f.queue[0].classificationStatus='jev-provisional';
    else if(mutation==='undispatched')f.queue[0].classificationStatus='not-dispatched';
    else if(mutation==='wrong-original')f.queue[0].requestId='foreign';
    else f.queue[0].reason=mutation;
    assert.throws(()=>classifier.applyClassificationRetries(f.queue,f.requests,[f.record]),{code:'ERR_ASSERTION'});
  }
});

test('retry rejects duplicate attempts, unbound bytes and invented request identities',()=>{
  for(const mutation of ['duplicate','binding','id','unknown-original']){
    const f=fixture();
    if(mutation==='binding'){const raw=JSON.parse(f.record.result.content[0].text);raw.request_digest='0'.repeat(64);f.record.result.content[0].text=JSON.stringify(raw);}
    if(mutation==='id')f.record.request_id+='-another';
    if(mutation==='unknown-original')f.record.originalRequestId='foreign';
    assert.throws(()=>classifier.applyClassificationRetries(f.queue,f.requests,mutation==='duplicate'?[f.record,f.record]:[f.record]),{code:'ERR_ASSERTION'});
  }
});

test('a failed retry remains unavailable, never receives a fabricated domain',()=>{
  const f=fixture();
  const raw=JSON.parse(f.record.result.content[0].text);raw.status='unavailable';raw.reason='distribution-sum';delete raw.results;
  f.record.result.content[0].text=JSON.stringify(raw);
  const result=classifier.applyClassificationRetries(f.queue,f.requests,[f.record]);
  assert.equal(result[0].classificationStatus,'jev-unavailable');assert.equal(result[0].advisoryDomain,null);
});

test('retry may recover a settled argmax failure but not launder an invalid retry distribution',()=>{
  const f=fixture();f.queue[0].reason='argmax';
  assert.equal(classifier.applyClassificationRetries(f.queue,f.requests,[f.record])[0].advisoryDomain,'engineering');
  const raw=JSON.parse(f.record.result.content[0].text),item=f.retry.items[0].id;
  raw.results[item].probabilities.engineering=.8;
  f.record.result.content[0].text=JSON.stringify(raw);
  assert.throws(()=>classifier.applyClassificationRetries(f.queue,f.requests,[f.record]),/Invalid probability sum/);
});
