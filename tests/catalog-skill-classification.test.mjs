import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createClassificationRequests,wireBytes} from '../src/catalog-skill-classification.mjs';
import {normalizeJevReceipt,buildClassifiedQueue,bindingDigest,model,domainChoices} from '../src/catalog-skill-classification.mjs';
import {searchCatalogIntake} from '../src/catalog-skill-classification.mjs';
import {classificationsComplete} from '../src/catalog-skill-classification.mjs';
const sha=s=>createHash('sha256').update(s).digest('hex');
function fixture(n=20){const inputs=[],groups=[];for(let i=0;i<n;i++){const text=JSON.stringify({name:`skill-${i}`,description:'A software workflow'}),h=sha(`body-${i}`);inputs.push({inputSha256:sha(text),text,providerEligible:true,bodyHashes:[h]});groups.push({bodySha256:h,sourceIds:[`${i%2?'z':'a'}/repo@revision:${i}/SKILL.md`]});}return{inputs,groups};}
test('Jev requests bind exact metadata, balance source repositories and obey wire/item limits',()=>{
 const {inputs,groups}=fixture(),requests=createClassificationRequests(inputs,groups);
 assert.equal(requests.flatMap(x=>x.items).length,20);
 assert(requests.every(x=>x.items.length<=8&&wireBytes(x.items)<=15000));
 assert.deepEqual(requests,createClassificationRequests([...inputs].reverse(),[...groups].reverse()));
 const changed=structuredClone(inputs);changed[0].text='changed';assert.throws(()=>createClassificationRequests(changed,groups),/Changed classifier/);
 assert.throws(()=>createClassificationRequests(inputs,[]),/Unbound/);
});
test('ineligible inputs never become provider requests',()=>{
 const {inputs,groups}=fixture(2);inputs[0].providerEligible=false;inputs[0].text=null;
 assert.equal(createClassificationRequests(inputs,groups).flatMap(x=>x.items).length,1);
});
function receipt(request,status='proposal'){
 const results=Object.fromEntries(request.items.map(x=>[x.id,{status,selected_id:status==='proposal'?'engineering':null,probabilities:Object.fromEntries(Object.keys(domainChoices).map(k=>[k,k==='engineering'?1:0])),confidence:status==='proposal'?1:.5,margin:1}]));
 return{request_id:request.request_id,snapshot_id:request.snapshot_id,result:{content:[{type:'text',text:JSON.stringify({status:'ok',authority:'none',may_execute:false,results,returned_model:model,provider:'TypeSafe',snapshot_id:request.snapshot_id,request_digest:bindingDigest(request),accounted_microusd:7})}]}};
}
test('receipts must bind to exact request, model, snapshot and item IDs',()=>{
 const {inputs,groups}=fixture(2),request=createClassificationRequests(inputs,groups)[0],r=receipt(request);
 assert.equal(normalizeJevReceipt(request,r).labels.length,2);
 for(const patch of [{returned_model:'another'},{snapshot_id:'wrong'},{request_digest:'0'.repeat(64)},{results:{}},{authority:'execute'}]){
  const copy=structuredClone(r),raw=JSON.parse(copy.result.content[0].text);copy.result.content[0].text=JSON.stringify({...raw,...patch});
  assert.throws(()=>normalizeJevReceipt(request,copy));
 }
});
test('inference abstention and uncalled inputs stay distinct from provisional domains',()=>{
 const {inputs,groups}=fixture(10),requests=createClassificationRequests(inputs,groups);
 const result=buildClassifiedQueue(inputs,groups,requests,[receipt(requests[0],'abstain')]);
 assert.equal(result.length,10);assert.equal(result.filter(x=>x.classificationStatus==='jev-abstained').length,8);
 assert.equal(result.filter(x=>x.classificationStatus==='not-dispatched').length,2);
 assert(result.every(x=>x.advisoryDomain===null&&x.activation==='none'&&x.reviewStatus==='body-unreviewed'));
});
test('forged confidence or out-of-taxonomy choices do not become labels',()=>{
 const {inputs,groups}=fixture(1),request=createClassificationRequests(inputs,groups)[0],r=receipt(request),raw=JSON.parse(r.result.content[0].text);
 raw.results[request.items[0].id].selected_id='auto-execute';r.result.content[0].text=JSON.stringify(raw);
 assert.throws(()=>normalizeJevReceipt(request,r));
});
test('unavailable records without exact inner request binding are not silently assigned',()=>{
 const {inputs,groups}=fixture(1),request=createClassificationRequests(inputs,groups)[0],r=receipt(request);
 r.result.content[0].text=JSON.stringify({status:'unavailable',authority:'none',may_execute:false,reason:'distribution-sum'});
 assert.throws(()=>normalizeJevReceipt(request,r),/Unbound/);
});
test('unknown, abstained, excluded or uncalled bodies cannot make classification complete',()=>{
 assert.equal(classificationsComplete([{classificationStatus:'jev-provisional',advisoryDomain:'engineering'}]),true);
 for(const status of ['jev-unknown','jev-abstained','excluded-selected-metadata','not-dispatched','jev-unavailable'])assert.equal(classificationsComplete([{classificationStatus:status,advisoryDomain:null}]),false);
 assert.equal(classificationsComplete([]),false);
});
test('domain discovery includes only bound provisional labels; ordinary search retains pending material',()=>{
 const {inputs,groups}=fixture(10),requests=createClassificationRequests(inputs,groups),queue=buildClassifiedQueue(inputs,groups,requests,[receipt(requests[0])]);
 const sources=groups.map(g=>({sourceId:g.sourceIds[0],bodySha256:g.bodySha256,name:'software workflow',description:'Write code',repository:'x/y',path:'SKILL.md'}));
 const results=searchCatalogIntake(sources,queue,{query:'software',domain:'engineering'});
 assert.equal(results.length,5);assert(results.every(x=>x.classificationStatus==='jev-provisional'&&x.activation==='none'));
 assert.equal(searchCatalogIntake(sources,queue,{query:'software',domain:'audio'}).length,0);
 assert.throws(()=>searchCatalogIntake(sources,queue,{query:'software',domain:'automatic'}));
 const pending=queue.filter(x=>x.classificationStatus==='not-dispatched');
 assert.equal(searchCatalogIntake(sources,pending,{query:'software'}).length,2);
 const unknown=queue.map(x=>({...x,classificationStatus:'jev-unknown',advisoryDomain:null}));
 assert.equal(searchCatalogIntake(sources,unknown,{query:'software',domain:'unknown',limit:2}).length,2);
});
