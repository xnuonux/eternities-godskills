import test from 'node:test';
import assert from 'node:assert/strict';
import { recoverRequest } from '../artifacts/universal-product-v1/exercises/retry-client.mjs';

function rig(overrides={}){
  let time=0;const keys=[],waits=[];let calls=0;
  return {keys,waits,get calls(){return calls;},options:{idempotencyKey:'intent-17',maxAttempts:3,deadlineMs:1000,now:()=>time,sleep:async ms=>{waits.push(ms);time+=ms;},send:async key=>{keys.push(key);calls++;return calls===1?{status:429,retryAfterMs:20}:{status:200,value:'ok'};},...overrides}};
}
test('actual skill-using agent code retries with one key and preserves the successful value',async()=>{
  const r=rig();assert.deepEqual(await recoverRequest(r.options),{status:'success',attempts:2,value:'ok'});
  assert.deepEqual(r.keys,['intent-17','intent-17']);assert.deepEqual(r.waits,[20]);
});
test('actual agent code stops at the attempt budget even with zero delays',async()=>{
  let calls=0;const r=rig({send:async()=>{calls++;return {status:429,retryAfterMs:0};}});
  assert.deepEqual(await recoverRequest(r.options),{status:'exhausted',attempts:3});assert.equal(calls,3);
});
test('a delay crossing the deadline causes no extra dispatch or sleep',async()=>{
  let calls=0;const r=rig({deadlineMs:10,send:async()=>{calls++;return {status:429,retryAfterMs:20};}});
  assert.deepEqual(await recoverRequest(r.options),{status:'deadline',attempts:1});assert.equal(calls,1);assert.deepEqual(r.waits,[]);
});
test('malformed retry hints do not spin or silently retry',async()=>{
  for(const hint of [NaN,Infinity,-1,'20',undefined]){
    let calls=0;const r=rig({send:async()=>{calls++;return {status:429,retryAfterMs:hint};}});
    assert.deepEqual(await recoverRequest(r.options),{status:'invalid-guidance',attempts:1});assert.equal(calls,1);
  }
});
test('cancellation during a wait prevents the next request',async()=>{
  const controller=new AbortController();const r=rig({signal:controller.signal,sleep:async()=>controller.abort()});
  assert.deepEqual(await recoverRequest(r.options),{status:'cancelled',attempts:1});assert.equal(r.calls,1);
});
test('missing idempotency key and invalid attempt budget fail before dispatch',async()=>{
  for(const overrides of [{idempotencyKey:''},{maxAttempts:0},{maxAttempts:1.2},{deadlineMs:NaN}]){
    const r=rig(overrides);await assert.rejects(recoverRequest(r.options));assert.equal(r.calls,0);
  }
});
test('non-rate-limit responses are terminal and transport failures are never retried',async()=>{
  const r=rig({send:async()=>({status:503})});assert.deepEqual(await recoverRequest(r.options),{status:'terminal',attempts:1,responseStatus:503});
  let calls=0;const bad=rig({send:async()=>{calls++;throw new Error('uncertain transport');}});
  await assert.rejects(recoverRequest(bad.options),/uncertain transport/);assert.equal(calls,1);
});
