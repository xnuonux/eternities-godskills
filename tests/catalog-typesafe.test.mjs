import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {domainChoices} from '../src/catalog-skill-classification.mjs';
import * as native from '../src/catalog-typesafe.mjs';
const request={request_id:'source-one',snapshot_id:'frozen',items:[{id:'s-abc',primitive:'choice',text:'Debug Python programs',question:'Which domain?',choices:domainChoices}]};
const response=()=>({model:'jev-1.13.0',answers:{q0:{type:'choice',choice:'engineering',confidence:1,probabilities:Object.fromEntries(Object.keys(domainChoices).map(k=>[k,k==='engineering'?1:0]))}},usage:{input_tokens:100,output_tokens:20}});
const queue=[{inputSha256:'abc',classificationStatus:'not-dispatched',activation:'none',reviewStatus:'body-unreviewed'}];

test('native route retains its own model and rejects altered source binding',()=>{
  const record=native.createDirectRecord(request,{httpStatus:200,response:response()});
  const [row]=native.applyDirectReceipts(queue,[request],[record]);
  assert.equal(row.model,'jev-1.13.0');assert.equal(row.providerRoute,'typesafe-direct');
  assert.equal(row.advisoryDomain,'engineering');assert.equal(row.authority,'none');
  assert.equal(row.activation,'none');assert.equal(row.reviewStatus,'body-unreviewed');
  assert.throws(()=>native.applyDirectReceipts(queue,[{...request,snapshot_id:'changed'}],[record]));
});
test('direct continuation cannot overwrite previous attempts or duplicate inputs',()=>{
  const record=native.createDirectRecord(request,{httpStatus:200,response:response()});
  for(const status of ['jev-provisional','jev-abstained','jev-unavailable'])
    assert.throws(()=>native.applyDirectReceipts([{...queue[0],classificationStatus:status}],[request],[record]));
  assert.throws(()=>native.applyDirectReceipts(queue,[request],[record,record]));
});
test('native invalid model, sum, argmax and confidence cannot become labels',()=>{
  for(const mutate of [r=>r.model='jev-latest',r=>r.answers.q0.probabilities.engineering=.99,r=>r.answers.q0.choice='data',r=>r.answers.q0.confidence=2]){
    const raw=response();mutate(raw);
    assert.throws(()=>native.createDirectRecord(request,{httpStatus:200,response:raw}));
  }
  const raw=response();raw.answers.q0.confidence=.5;
  const record=native.createDirectRecord(request,{httpStatus:200,response:raw});
  assert.equal(native.applyDirectReceipts(queue,[request],[record])[0].classificationStatus,'jev-abstained');
});
test('saved native calls replay without dispatch; pending attempts prevent resubmission',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'gsk-direct-test-'));
  let calls=0;const transport=async()=>{calls++;return{httpStatus:200,response:response()}};
  const first=await native.dispatchDirectOnce(request,directory,transport);
  const second=await native.dispatchDirectOnce(request,directory,transport);
  assert.deepEqual(second,first);assert.equal(calls,1);
  const changed={...request,request_id:'source-two'};
  const id=native.directIdentity(changed);
  await writeFile(join(directory,id+'.pending'),'reserved',{flag:'wx'});
  await assert.rejects(native.dispatchDirectOnce(changed,directory,transport));
  assert.equal(calls,1);assert.equal(await readFile(join(directory,id+'.pending'),'utf8'),'reserved');
});
test('HTTP failures and malformed results persist honestly and are never retried',async()=>{
  for(const result of [{httpStatus:402},{httpStatus:200,response:{model:'wrong'}}]){
    const directory=await mkdtemp(join(tmpdir(),'gsk-direct-failure-'));let calls=0;
    const transport=async()=>{calls++;return result};
    const record=await native.dispatchDirectOnce(request,directory,transport);
    assert.equal(record.status,'unavailable');
    assert.equal(native.applyDirectReceipts(queue,[request],[record])[0].classificationStatus,'jev-unavailable');
    await native.dispatchDirectOnce(request,directory,transport);assert.equal(calls,1);
  }
});
