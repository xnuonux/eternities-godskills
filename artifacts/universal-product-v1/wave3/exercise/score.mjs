import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

const identity={data:'d1',split:'s1',preprocess:'p1',code:'c1',architecture:'a1',environment:'e1'};
const base=()=>({request:{operation:'cache',identity:{...identity},requiredState:['model','optimizer','rng','sampler'],evaluationIds:['holdout']},artifact:{kind:'cache',status:'complete',verified:true,identity:{...identity},dependsOn:['data','split','preprocess','code'],state:{model:true,optimizer:true,rng:true,sampler:true},fitIds:['train'],path:'moved/output',label:'any-name'}});
const cases=[];
function add(name,want,mutate=()=>{}){const input=base();mutate(input);cases.push({name,want,input});}
add('valid moved cache','reuse');
add('changed split cannot reuse features','rebuild',x=>x.request.identity.split='s2');
add('changed preprocessing cannot reuse features','rebuild',x=>x.request.identity.preprocess='p2');
add('irrelevant architecture change retains cache','reuse',x=>x.request.identity.architecture='a2');
add('declared architecture dependency changes cache','rebuild',x=>{x.request.identity.architecture='a2';x.artifact.dependsOn.push('architecture');});
add('missing identity is unknown not a change','block',x=>delete x.artifact.identity.data);
add('partial cache blocked','block',x=>x.artifact.status='partial');
add('unverified bytes blocked','block',x=>x.artifact.verified=false);
add('string true is not verified','block',x=>x.artifact.verified='true');
add('missing required cache dependency blocked','block',x=>x.artifact.dependsOn=x.artifact.dependsOn.filter(k=>k!=='split'));
add('unknown dependency cannot be ignored','block',x=>x.artifact.dependsOn.push('mystery'));
add('fit leakage blocks use','block',x=>x.artifact.fitIds.push('holdout'));
add('absent fit declaration is unknown','block',x=>delete x.artifact.fitIds);
add('absent evaluation declaration is unknown','block',x=>delete x.request.evaluationIds);
add('known empty fit is not unknown','reuse',x=>x.artifact.fitIds=[]);
add('valid full resume','resume',x=>{x.request.operation='resume';x.artifact.kind='checkpoint';});
add('resume cannot silently use changed data','block',x=>{x.request.operation='resume';x.artifact.kind='checkpoint';x.request.identity.data='d2';});
add('resume cannot silently use changed environment','block',x=>{x.request.operation='resume';x.artifact.kind='checkpoint';x.request.identity.environment='e2';});
add('missing RNG blocks exact resume','block',x=>{x.request.operation='resume';x.artifact.kind='checkpoint';delete x.artifact.state.rng;});
add('unspecified resume state is not enough','block',x=>{x.request.operation='resume';x.artifact.kind='checkpoint';delete x.request.requiredState;});
add('wrong kind blocks resume','block',x=>x.request.operation='resume');
add('explicit new-run warm start allows changed data','warm-start',x=>{x.request.operation='warm-start';x.artifact.kind='checkpoint';x.request.identity.data='d2';x.artifact.state={model:true};});
add('incompatible architecture blocks warm start','block',x=>{x.request.operation='warm-start';x.artifact.kind='checkpoint';x.request.identity.architecture='a2';});
add('warm start still preserves holdout','block',x=>{x.request.operation='warm-start';x.artifact.kind='checkpoint';x.artifact.fitIds=['holdout'];});
add('unsupported operation blocked','block',x=>x.request.operation='magical-resume');
add('malformed input blocked','block',x=>x.request=null);

export async function score(modulePath){
  const {assessReuse}=await import(pathToFileURL(resolve(modulePath)));
  assert.equal(typeof assessReuse,'function');
  const results=[];
  for(const item of cases){
    const before=JSON.stringify(item.input);
    try{
      const actual=await assessReuse(item.input.request,item.input.artifact);
      assert.equal(actual?.decision,item.want);
      assert.ok(Array.isArray(actual.reasons)&&actual.reasons.every(x=>typeof x==='string'&&x.trim()));
      if(item.want==='block'||item.want==='rebuild')assert.ok(actual.reasons.length>0);
      assert.equal(JSON.stringify(item.input),before,'inputs mutated');
      results.push({name:item.name,want:item.want,actual:actual.decision,pass:true});
    }catch(error){results.push({name:item.name,want:item.want,pass:false,error:error.message});}
  }
  return {cases:results.length,passed:results.filter(x=>x.pass).length,results};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const result=await score(process.argv[2]);console.log(JSON.stringify(result,null,2));process.exitCode=result.passed===result.cases?0:1;
}
