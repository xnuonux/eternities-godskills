import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const hash = text => createHash('sha256').update(text).digest('hex');
const canonical = value => JSON.stringify(value, (_key,v) => v && !Array.isArray(v) && typeof v === 'object'
  ? Object.fromEntries(Object.keys(v).sort().map(k => [k,v[k]])) : v);
const commit = '1'.repeat(40); // Synthetic fixture identity, not a release claim.
const review = {implementationCommit:commit, reviewerTaskId:'synthetic-review', disposition:'approved-structural-scope'};

async function builder() {
  try { return await import('../scripts/build-effect-only-executable-receipt.mjs'); }
  catch (error) { assert.fail(`missing receipt builder: ${error.message}`); }
}

async function fixture(t) {
  const dir = await mkdtemp(path.join(tmpdir(),'effect-source-receipt-'));
  t.after(() => rm(dir,{recursive:true,force:true}));
  for (const file of [
    'scripts/effect-only-v2.mjs','scripts/build-effect-only-executable-receipt.mjs',
    'src/effect-intent-v2.mjs','src/io.mjs','src/intent-contracts.mjs','src/routing-contracts.mjs',
    'tests/effect-intent-v2.test.mjs','tests/effect-only-v2-cli.test.mjs','tests/effect-only-executable-receipt.test.mjs',
    'data/effect-only-golden-vector-v2.json','data/effect-only-result-v2.json',
  ]) {
    await mkdir(path.dirname(path.join(dir,file)),{recursive:true});
    await cp(path.join(root,file),path.join(dir,file));
  }
  const logs = path.join(dir,'artifacts/effect-only-v2');
  await mkdir(logs,{recursive:true});
  for (const mode of ['targeted','full']) {
    const command = ['node','--test','--test-reporter=spec', ...(mode === 'targeted'
      ? ['tests/effect-intent-v2.test.mjs','tests/effect-only-v2-cli.test.mjs','tests/effect-only-executable-receipt.test.mjs'] : [])];
    const header = {format:'node-spec-summary-v1',sourceCommit:commit,command,exitCode:mode === 'full' ? 1 : 0,
      baselineReproduced:mode === 'full'};
    const lines = ['ℹ tests 12',`ℹ pass ${mode === 'full' ? 10 : 12}`,`ℹ fail ${mode === 'full' ? 1 : 0}`,
      `ℹ skipped ${mode === 'full' ? 1 : 0}`,'ℹ cancelled 0','ℹ todo 0'];
    if (mode === 'full') lines.push('✖ installed Codex routing keeps raw capability as the floor and activation evidence-bound (1ms)');
    await writeFile(path.join(logs,`${mode}.log`),JSON.stringify(header)+'\n'+lines.join('\n')+'\n');
  }
  return {repositoryRoot:dir,sourceCommit:commit,review};
}

test('receipt binds exact executable closure, test files, vectors and observed test summaries', async t => {
  const {buildEffectOnlyExecutableReceipt} = await builder();
  const input = await fixture(t);
  const result = await buildEffectOnlyExecutableReceipt(input);
  assert.equal(result.protocolId,'eternities-godskills-effect-only-executable-v2');
  assert.equal(result.status,'verified-structural-only');
  assert.equal(result.schemaVersion,1);
  assert.equal(result.sourceCommit,commit);
  assert.deepEqual(result.sources.map(s => s.path),[
    'scripts/effect-only-v2.mjs','src/effect-intent-v2.mjs','src/intent-contracts.mjs','src/io.mjs','src/routing-contracts.mjs',
  ]);
  assert.equal(result.tests.length,3);
  assert.equal(result.vectors.length,2);
  assert.equal(result.verification.targeted.tests,12);
  assert.equal(result.verification.full.fail,1);
  assert.equal(result.verification.full.knownFailures[0].category,'installed-host-wording');
  for (const entry of [...result.sources,...result.tests,...result.vectors,result.builder]) {
    assert.equal(entry.sha256,hash(await readFile(path.join(input.repositoryRoot,entry.path))));
  }
  assert.deepEqual(result.entrypoint,result.sources[0]);
  const {receiptDigest,...body} = result;
  assert.equal(receiptDigest,hash(canonical(body)));
  assert.deepEqual(await buildEffectOnlyExecutableReceipt(input),result);
});

test('any recorded source mutation changes the receipt digest', async t => {
  const {buildEffectOnlyExecutableReceipt} = await builder();
  const input = await fixture(t);
  const original = await buildEffectOnlyExecutableReceipt(input);
  await writeFile(path.join(input.repositoryRoot,'src/effect-intent-v2.mjs'),'// changed\n'+await readFile(path.join(input.repositoryRoot,'src/effect-intent-v2.mjs'),'utf8'));
  const changed = await buildEffectOnlyExecutableReceipt(input);
  assert.notEqual(changed.receiptDigest,original.receiptDigest);
});

for (const [label, replacement] of [
  ['unrelated full failure', s => s.replace('installed Codex routing keeps raw capability as the floor and activation evidence-bound','source verification broken')],
  ['count disagreement', s => s.replace('ℹ pass 10','ℹ pass 12')],
  ['different source commit', s => s.replace(commit,'2'.repeat(40))],
  ['different command', s => s.replace('--test-reporter=spec','--test-name-pattern=skip-all')],
]) test(`refuses ${label} rather than minting a passing-looking root`, async t => {
  const {buildEffectOnlyExecutableReceipt} = await builder();
  const input = await fixture(t);
  const file = path.join(input.repositoryRoot,'artifacts/effect-only-v2/full.log');
  await writeFile(file,replacement(await readFile(file,'utf8')));
  await assert.rejects(buildEffectOnlyExecutableReceipt(input));
});

test('unknown or unreviewed disposition cannot mint structural root', async t => {
  const {buildEffectOnlyExecutableReceipt} = await builder();
  const input = await fixture(t);
  await assert.rejects(buildEffectOnlyExecutableReceipt({...input,review:{...review,disposition:'pending'}}));
  await assert.rejects(buildEffectOnlyExecutableReceipt({...input,sourceCommit:'not-a-commit'}));
});

test('unexpected extra dependency is not silently admitted into executable closure', async t => {
  const {buildEffectOnlyExecutableReceipt} = await builder();
  const input = await fixture(t);
  const entry = path.join(input.repositoryRoot,'scripts/effect-only-v2.mjs');
  await writeFile(entry,"import '../src/extra.mjs';\n"+await readFile(entry,'utf8'));
  await writeFile(path.join(input.repositoryRoot,'src/extra.mjs'),'export const surprise = true;\n');
  await assert.rejects(buildEffectOnlyExecutableReceipt(input),/closure/);
});

test('real Node failure-summary heading and repeated failure name remain valid evidence', async t => {
  const {buildEffectOnlyExecutableReceipt} = await builder();
  const input = await fixture(t);
  const log = path.join(input.repositoryRoot,'artifacts/effect-only-v2/full.log');
  await writeFile(log,await readFile(log,'utf8')+'✖ failing tests:\n✖ installed Codex routing keeps raw capability as the floor and activation evidence-bound (1ms)\n');
  const result = await buildEffectOnlyExecutableReceipt(input);
  assert.equal(result.verification.full.fail,1);
  assert.equal(result.verification.full.knownFailures.length,1);
});
