import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

test('the mandatory regression suite passes with sibling review reads denied', () => {
  const call = spawnSync(process.execPath,
    ['--import',pathToFileURL(path.join(here,'restrict-sibling-reads.mjs')).href,
      path.join(here,'oracle.test.mjs')],
    {cwd:here,encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024});
  assert.equal(call.error,undefined, String(call.error));
  assert.equal(call.status,0,`suite must be self-contained; stdout=${call.stdout}\nstderr=${call.stderr}`);
  assert.equal(call.stderr,'');
});
