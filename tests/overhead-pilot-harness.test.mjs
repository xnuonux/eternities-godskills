import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {evaluate} from '../artifacts/universal-product-v1/wave9-agent-workflows/overhead-pilot/checks.mjs';
import {runChecks} from '../artifacts/universal-product-v1/wave9-agent-workflows/overhead-pilot/reference.mjs';

test('overhead pilot checker accepts independently constructed contract behavior',async()=>{
  const result=await evaluate(runChecks);assert.equal(result.total,12);assert.equal(result.passed,12);
});
test('overhead pilot checker does not pass empty or always-invalid implementations',async()=>{
  const empty=await evaluate(async()=>[]);assert.equal(empty.passed,1);assert.equal(empty.total,12);
  const rejecting=await evaluate(async()=>{throw new TypeError('always');});assert(rejecting.passed<rejecting.total);assert(rejecting.cases.some(x=>!x.pass&&x.name.includes('shared prerequisites')));
});
test('overhead pilot checker catches weakened preflight and duplicate effects',async()=>{
  const weak=await evaluate(async(checks,targets,execute)=>{const selected=new Set(targets);return runChecks(checks.filter(x=>selected.has(x?.id)),targets,execute);});
  assert.equal(weak.cases.find(x=>x.name==='unselected cycle rejects before execution').pass,false);
  const duplicate=await evaluate((checks,targets,execute)=>runChecks(checks,targets,async id=>{await execute(id);return execute(id);}));
  assert.equal(duplicate.cases.find(x=>x.name.startsWith('shared prerequisites')).pass,false);
});
test('missing consumer artifact is unavailable rather than a valid scored result',()=>{
  const script=fileURLToPath(new URL('../artifacts/universal-product-v1/wave9-agent-workflows/overhead-pilot/evaluate.mjs',import.meta.url));
  const r=spawnSync(process.execPath,[script,script+'.absent'],{encoding:'utf8',timeout:10000,windowsHide:true});
  assert.equal(r.status,2);const result=JSON.parse(r.stdout);assert.equal(result.kind,'invalid-or-unavailable-artifact');assert.equal(result.passed,undefined);
});
test('preserved pilot artifacts remain bound to frozen inputs and recorded results',async()=>{
  const root=new URL('../artifacts/universal-product-v1/wave9-agent-workflows/overhead-pilot/',import.meta.url);
  const sha=b=>createHash('sha256').update(b).digest('hex');
  const read=p=>readFile(new URL(p,root));
  const planBytes=await read('frozen-plan.json'),plan=JSON.parse(planBytes),result=JSON.parse(await read('result.json'));
  assert.equal(sha(planBytes),result.planSha256);
  for(const [path,hash]of Object.entries(plan.files))assert.equal(sha(await read(path)),hash);
  for(const arm of ['a','b']){
    const record=result.arms[arm];
    for(const [path,entry]of Object.entries(record.files)){
      const bytes=await read(`runs/${arm}/${path}`);assert.equal(bytes.length,entry.bytes);assert.equal(sha(bytes),entry.sha256);
    }
    assert.equal(sha(await read(`runs/${arm}/guidance.md`)),plan.arms[arm].guidanceSha256);
    assert.equal(sha(await read(`runs/${arm}/task.md`)),plan.arms[arm].taskSha256);
    assert.equal(sha(await read(`runs/${arm}/prompt.txt`)),plan.arms[arm].promptSha256);
    const consumer=await import(new URL(`runs/${arm}/runner.mjs`,root));
    assert.deepEqual(await evaluate(consumer.runChecks),record.checkResult);
  }
});
