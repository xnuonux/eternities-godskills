import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const cli = path.join(root, 'scripts/effect-only-v2.mjs');
const vector = JSON.parse(await readFile(path.join(root,'data/effect-only-golden-vector-v2.json')));
const expected = JSON.parse(await readFile(path.join(root,'data/effect-only-result-v2.json')));

async function fixture(t) {
  const folder = await mkdtemp(path.join(tmpdir(), 'effect-only-cli-'));
  t.after(() => rm(folder, {recursive:true, force:true}));
  const request = path.join(folder,'request.json');
  const source = path.join(folder,'source.json');
  const output = path.join(folder,'output.json');
  await writeFile(request, JSON.stringify(vector.request));
  await writeFile(source, JSON.stringify(vector.expectedSource));
  return {folder, request, source, output,
    args:['--request',request,'--expected-source',source,'--output',output]};
}
const run = (args, cwd) => spawnSync(process.execPath, [cli,...args], {cwd, encoding:'utf8', timeout:10000});

test('standalone executable produces the exact reviewed pair outside repository cwd', async t => {
  const f = await fixture(t);
  const result = run(f.args, f.folder);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  assert.deepEqual(JSON.parse(await readFile(f.output)), expected);
  assert.equal(await readFile(f.request,'utf8'), JSON.stringify(vector.request));
  assert.equal(await readFile(f.source,'utf8'), JSON.stringify(vector.expectedSource));
});

for (const [label, alter] of [
  ['missing request', a => a.slice(2)],
  ['missing source', a => [...a.slice(0,2),...a.slice(4)]],
  ['missing output', a => a.slice(0,4)],
  ['duplicate flag', a => [...a,'--request',a[1]]],
  ['model override', a => [...a,'--model','anything']],
  ['dangling value', a => [...a.slice(0,5)]],
]) test(`CLI rejects ${label} without writing output`, async t => {
  const f = await fixture(t);
  const result = run(alter(f.args), f.folder);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /effect-only-v2:/);
  await assert.rejects(readFile(f.output), {code:'ENOENT'});
});

test('failed binding preserves existing output and does not emit a success artifact', async t => {
  const f = await fixture(t);
  await writeFile(f.output, 'prior checked evidence');
  await writeFile(f.source, JSON.stringify({...vector.expectedSource,requestDigest:'0'.repeat(64)}));
  const result = run(f.args, f.folder);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /binding mismatch/);
  assert.equal(await readFile(f.output,'utf8'), 'prior checked evidence');
});

for (const field of ['request','source']) test(`output cannot overwrite ${field} input`, async t => {
  const f = await fixture(t);
  const before = await readFile(f[field],'utf8');
  const result = run([...f.args.slice(0,5), f[field]], f.folder);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /output.*input/);
  assert.equal(await readFile(f[field],'utf8'), before);
});

test('successful request refuses existing output instead of replacing prior evidence', async t => {
  const f = await fixture(t);
  await writeFile(f.output, 'prior checked evidence');
  const result = run(f.args, f.folder);
  assert.equal(result.status, 1);
  assert.equal(await readFile(f.output,'utf8'), 'prior checked evidence');
});

test('oversized input is refused before parsing without disclosing body', async t => {
  const f = await fixture(t);
  const request = {...vector.request, text:'private-input-' + 'x'.repeat(1024 * 1024)};
  const canonical = JSON.stringify(request, (_key,v) => v && !Array.isArray(v) && typeof v === 'object'
    ? Object.fromEntries(Object.keys(v).sort().map(k => [k,v[k]])) : v);
  await writeFile(f.request, JSON.stringify(request));
  await writeFile(f.source, JSON.stringify({...vector.expectedSource,
    requestDigest:createHash('sha256').update(canonical).digest('hex')}));
  const result = run(f.args, f.folder);
  assert.equal(result.status, 1);
  assert.doesNotMatch(result.stderr, /private-input/);
  await assert.rejects(readFile(f.output), {code:'ENOENT'});
});

test('invalid JSON and invalid context never echo request content', async t => {
  const f = await fixture(t);
  for (const content of [
    '{"private-input-secret": invalid}',
    JSON.stringify({...vector.request, context:{...vector.request.context, maximumRisk:'private-input-secret'}}),
  ]) {
    await writeFile(f.request, content);
    const result = run(f.args, f.folder);
    assert.equal(result.status, 1);
    assert.doesNotMatch(result.stderr, /private-input-secret/);
    await assert.rejects(readFile(f.output), {code:'ENOENT'});
  }
});

test('output size gate refuses amplified result without partial publication', async t => {
  const f = await fixture(t);
  const request = structuredClone(vector.request);
  Object.assign(request.effectAssessment, {state:'unknown', unresolvedDecisions:['x'.repeat(750000)]});
  const canonical = JSON.stringify(request, (_key,v) => v && !Array.isArray(v) && typeof v === 'object'
    ? Object.fromEntries(Object.keys(v).sort().map(k => [k,v[k]])) : v);
  const source = {...vector.expectedSource,requestDigest:createHash('sha256').update(canonical).digest('hex')};
  await writeFile(f.request, JSON.stringify(request));
  await writeFile(f.source, JSON.stringify(source));
  const result = run(f.args, f.folder);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /output.*limit/);
  await assert.rejects(readFile(f.output), {code:'ENOENT'});
});
