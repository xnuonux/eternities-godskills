import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const base=new URL('../artifacts/universal-product-v1/wave4/exercise/',import.meta.url);
test('wave4 original forward result remains reproducible with its imperfect contract',async()=>{
  const expected={
    'candidate-skill.md':'7710f20ce711ba1bfc1c1561e80bb17855f90375fa9af77185a53c841e700e9c',
    'task.md':'47621b6d6993be2917bfb5e183c93aba5317160c3d240e92135d7a92b674d400',
    'score.mjs':'753ba7d941ab228a06bfbf7cf3f1ffb62922795e425c97eef9934bedc136ab6a',
    'candidate/consumer.mjs':'896b8d031791070ee27a385bbf2fe3b7f155f22bf9e64403eae625fef5e0ee54'
  };
  for(const [path,digest] of Object.entries(expected))assert.equal(createHash('sha256').update(await readFile(new URL(path,base))).digest('hex'),digest,path);
  const actual=spawnSync(process.execPath,[fileURLToPath(new URL('score.mjs',base)),fileURLToPath(new URL('candidate/consumer.mjs',base))],{encoding:'utf8',windowsHide:true,timeout:10000});
  assert.equal(actual.status,1);assert.equal(actual.stderr,'');
  const report=JSON.parse(actual.stdout),saved=JSON.parse(await readFile(new URL('result.json',base)));
  assert.deepEqual(report,saved);assert.equal(report.cases,38);assert.equal(report.passed,37);
  assert.deepEqual(report.results.filter(r=>!r.passed).map(r=>r.name),['blank abstention']);
});
