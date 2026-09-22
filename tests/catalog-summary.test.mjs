import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {mkdtemp,mkdir,writeFile,copyFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {loadCatalogWithContinuations} from '../src/catalog-continuation.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const script=fileURLToPath(new URL('../scripts/query-catalog-skill-intake.mjs',import.meta.url));
const run=args=>spawnSync(process.execPath,[script,...args],{cwd:root,encoding:'utf8',timeout:10000});

test('summary reports verified intake progress without search results',async()=>{
  const loaded=await loadCatalogWithContinuations(root),result=run(['--summary']);
  assert.equal(result.status,0,result.stderr);
  const summary=JSON.parse(result.stdout);
  assert.deepEqual(Object.keys(summary).sort(),['activation','authority','bodyStatuses','classificationComplete','continuation','mode','networkCalls','scope','sourceCount','uniqueBodyCount']);
  assert.equal(summary.mode,'summary');
  assert.equal(summary.sourceCount,loaded.sources.length);
  assert.equal(summary.uniqueBodyCount,loaded.queue.length);
  assert.equal(summary.authority,'none');
  assert.equal(summary.activation,'none');
  assert.equal(summary.networkCalls,0);
  assert.equal(summary.classificationComplete,loaded.classificationComplete);
  assert.deepEqual(summary.continuation,loaded.continuation);
  assert.deepEqual(summary.bodyStatuses,loaded.bodyStatuses);
  assert(!Object.hasOwn(summary,'results'));
  assert(!Object.hasOwn(summary,'sources'));
  assert(!Object.hasOwn(summary,'queue'));
});

test('summary derives changed counts and rejects damaged evidence through the real CLI',async t=>{
  const fixture=await mkdtemp(join(tmpdir(),'gsk-summary-integrity-'));
  t.after(()=>rm(fixture,{recursive:true,force:true}));
  for(const path of ['scripts/query-catalog-skill-intake.mjs','src/catalog-continuation.mjs','src/catalog-skill-classification.mjs','src/cold-intake-search.mjs']){
    await mkdir(dirname(join(fixture,path)),{recursive:true});
    await copyFile(join(root,path),join(fixture,path));
  }
  const sha=b=>createHash('sha256').update(b).digest('hex'),json=x=>JSON.stringify(x)+'\n';
  const intake=join(fixture,'data/quarry-intake-2026-09-21-catalog801');
  const artifacts=join(fixture,'artifacts/catalog801-continuations');
  await mkdir(intake,{recursive:true});await mkdir(artifacts,{recursive:true});
  // Valid empty intake is deliberately unlike the live catalog: a hardcoded
  // count or a skipped loader cannot satisfy both this and the live test.
  const files={'sources.jsonl':'\n','classification-inputs.jsonl':'\n','body-groups.jsonl':'\n'};
  const manifest={outputs:Object.fromEntries(Object.entries(files).map(([p,b])=>[p,{sha256:sha(b)}]))};
  const plan={persistedRequestPlanSha256:sha('\n')};
  const summary={intakeManifestSha256:sha(json(manifest)),requestPlanSha256:sha('\n'),queueSha256:sha('\n'),receiptFiles:[]};
  const overlay={schema:'catalog-continuation-v1',intakeManifestSha256:sha(json(manifest)),classificationSummarySha256:sha(json(summary)),requestPlanSha256:sha('\n'),requestPlanReceiptSha256:sha(json(plan)),receipts:[]};
  for(const [p,b]of Object.entries({...files,'manifest.json':json(manifest),'classification-summary.json':json(summary),'jev-request-plan-receipt.json':json(plan),'refinement-queue.jsonl':'\n'}))await writeFile(join(intake,p),b);
  await writeFile(join(artifacts,'manifest.json'),json(overlay));
  const invoke=()=>spawnSync(process.execPath,[join(fixture,'scripts/query-catalog-skill-intake.mjs'),'--summary'],{encoding:'utf8',timeout:10000});
  const valid=invoke();assert.equal(valid.status,0,valid.stderr);
  const value=JSON.parse(valid.stdout);
  assert.equal(value.sourceCount,0);assert.equal(value.uniqueBodyCount,0);assert.deepEqual(value.bodyStatuses,{});
  assert.equal(value.classificationComplete,false);assert.equal(value.continuation.providerReceipts,0);
  const rejected=result=>{assert.equal(result.status,1);assert.equal(result.stdout,'');assert.match(result.stderr,/Changed evidence/);};
  await t.test('corrupted frozen queue',async()=>{
    await writeFile(join(intake,'refinement-queue.jsonl'),'{}\n');
    rejected(invoke());await writeFile(join(intake,'refinement-queue.jsonl'),'\n');
  });
  await t.test('corrupted continuation receipt',async()=>{
    overlay.receipts=[{path:'artifacts/catalog801-continuations/receipt.json',sha256:sha('original bytes')}];
    await writeFile(join(artifacts,'receipt.json'),'changed bytes');
    await writeFile(join(artifacts,'manifest.json'),json(overlay));
    rejected(invoke());
  });
});

test('summary rejects combinations, repeated flags, values and unknown arguments',()=>{
  for(const args of [
    ['--summary','--query','devtools-vue'],
    ['--query','devtools-vue','--summary'],
    ['--summary','--domain','engineering'],
    ['--summary','--limit','2'],
    ['--summary','--summary'],
    ['--summary','value'],
    ['--summary','--unknown'],
    ['--unknown'],
    ['--query','devtools-vue','--unknown'],
    ['--query',''],
    ['--query','devtools-vue','--limit','9'],
  ]){
    const result=run(args);
    assert.notEqual(result.status,0,`expected rejection: ${args.join(' ')}`);
    assert.equal(result.stdout,'',`unexpected success JSON: ${args.join(' ')}`);
  }
});
