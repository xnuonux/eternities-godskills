import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root=fileURLToPath(new URL('../',import.meta.url));
const sha=x=>createHash('sha256').update(x).digest('hex');
const canonical=v=>JSON.stringify(v,(_k,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
const commit='1'.repeat(40);
const review={implementationCommit:commit,reviewerTaskId:'synthetic-review',disposition:'approved-structural-scope'};
async function builder(){try{return await import('../scripts/build-effect-only-verifier-receipt.mjs');}catch(e){assert.fail(`missing sidecar builder: ${e.message}`);}}
async function fixture(t){
  const dir=await mkdtemp(path.join(tmpdir(),'verifier-receipt-'));
  t.after(()=>rm(dir,{recursive:true,force:true}));
  for(const file of ['scripts/verify-effect-only-v2.mjs','scripts/build-effect-only-verifier-receipt.mjs','scripts/effect-only-v2.mjs',
    'src/effect-intent-v2.mjs','src/intent-contracts.mjs','src/io.mjs','src/routing-contracts.mjs',
    'tests/effect-only-verifier-cli.test.mjs','tests/effect-only-verifier-receipt.test.mjs',
    'receipts/effect-only-executable-v2.json','data/effect-only-golden-vector-v2.json','data/effect-only-result-v2.json']){
    await mkdir(path.dirname(path.join(dir,file)),{recursive:true});await cp(path.join(root,file),path.join(dir,file));
  }
  await mkdir(path.join(dir,'artifacts/effect-only-verifier-v2'),{recursive:true});
  for(const mode of ['targeted','full']){
    const command=['node','--test','--test-reporter=spec',...(mode==='targeted'?['tests/effect-only-verifier-cli.test.mjs','tests/effect-only-verifier-receipt.test.mjs']:[])];
    const header={format:'node-spec-summary-v1',sourceCommit:commit,command,exitCode:mode==='full'?1:0,baselineReproduced:mode==='full'};
    const lines=['ℹ tests 12',`ℹ pass ${mode==='full'?10:12}`,`ℹ fail ${mode==='full'?1:0}`,
      `ℹ skipped ${mode==='full'?1:0}`,'ℹ cancelled 0','ℹ todo 0'];
    if(mode==='full')lines.push('✖ failing tests:','✖ installed Codex routing keeps raw capability as the floor and activation evidence-bound (1ms)');
    await writeFile(path.join(dir,`artifacts/effect-only-verifier-v2/${mode}.log`),JSON.stringify(header)+'\n'+lines.join('\n')+'\n');
  }
  return {repositoryRoot:dir,sourceCommit:commit,review};
}
test('sidecar root pins frozen parent and exact shared consumer closure',async t=>{
  const {buildEffectOnlyVerifierReceipt}=await builder();const input=await fixture(t);
  const result=await buildEffectOnlyVerifierReceipt(input);
  assert.equal(result.protocolId,'eternities-godskills-effect-only-verifier-v2');
  assert.equal(result.status,'verified-structural-only');
  assert.deepEqual(result.parent,{path:'receipts/effect-only-executable-v2.json',
    sha256:'f4baee63d9d802f7a985b5570deb81bbf174dbad3d7aea3d3aba67d546851e04',
    receiptDigest:'03fe45aeb133b715354174867a05781fac9b3cfa5353edf020cecdafa1a88a73'});
  assert.deepEqual(result.sources.map(x=>x.path),['scripts/verify-effect-only-v2.mjs','src/effect-intent-v2.mjs','src/intent-contracts.mjs','src/io.mjs','src/routing-contracts.mjs']);
  for(const item of [...result.sources,...result.tests,...result.vectors,result.builder])assert.equal(item.sha256,sha(await readFile(path.join(input.repositoryRoot,item.path))));
  assert.deepEqual(result.entrypoint,result.sources[0]);assert.equal(result.verification.targeted.pass,12);
  assert.equal(result.verification.full.fail,1);assert.equal(result.tests.length,2);
  const {receiptDigest,...body}=result;assert.equal(receiptDigest,sha(canonical(body)));
  assert.deepEqual(await buildEffectOnlyVerifierReceipt(input),result);
});
for(const file of ['receipts/effect-only-executable-v2.json','src/effect-intent-v2.mjs','scripts/effect-only-v2.mjs','data/effect-only-result-v2.json'])test(`rejects changed parent-bound ${file}`,async t=>{
  const {buildEffectOnlyVerifierReceipt}=await builder();const input=await fixture(t);
  await writeFile(path.join(input.repositoryRoot,file),(await readFile(path.join(input.repositoryRoot,file),'utf8'))+'\n');
  await assert.rejects(buildEffectOnlyVerifierReceipt(input),/parent|shared|vector/);
});
for(const [label,change] of [
  ['unexpected full failure',s=>s.replace('installed Codex routing keeps raw capability as the floor and activation evidence-bound','unrelated break')],
  ['stale source',s=>s.replace(commit,'2'.repeat(40))],
  ['wrong counts',s=>s.replace('ℹ pass 10','ℹ pass 11')],
])test(`rejects ${label} evidence`,async t=>{
  const {buildEffectOnlyVerifierReceipt}=await builder();const input=await fixture(t);
  const file=path.join(input.repositoryRoot,'artifacts/effect-only-verifier-v2/full.log');
  await writeFile(file,change(await readFile(file,'utf8')));await assert.rejects(buildEffectOnlyVerifierReceipt(input));
});
test('refuses unreviewed source and extra executable dependency',async t=>{
  const {buildEffectOnlyVerifierReceipt}=await builder();const input=await fixture(t);
  await assert.rejects(buildEffectOnlyVerifierReceipt({...input,review:{...review,disposition:'pending'}}));
  const file=path.join(input.repositoryRoot,'scripts/verify-effect-only-v2.mjs');
  await writeFile(file,"import '../src/extra.mjs';\n"+await readFile(file,'utf8'));
  await writeFile(path.join(input.repositoryRoot,'src/extra.mjs'),'export const extra=true;\n');
  await assert.rejects(buildEffectOnlyVerifierReceipt(input),/closure/);
});
