import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readPinnedSourceBytes } from '../src/pinned-source-bytes.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');

test('exact historic bytes survive a newer working tree without modifying it',async()=>{
  const root=await mkdtemp(join(tmpdir(),'godskills-pinned-'));
  const git=args=>execFileSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true});
  git(['init','-q']);await mkdir(join(root,'skills'));
  const file=join(root,'skills','SKILL.md');await writeFile(file,'historic\nsource\n');
  git(['-c','core.autocrlf=false','add','skills/SKILL.md']);
  git(['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','-c','commit.gpgsign=false','-c','core.hooksPath=/dev/null','commit','-qm','fixture']);
  const head=git(['rev-parse','HEAD']).trim();await writeFile(file,'new version\n');
  const record={head,sourcePath:'skills/SKILL.md',sourceAbsolutePath:file,bodySha256:sha('historic\r\nsource\r\n')};
  const result=await readPinnedSourceBytes(record);
  assert.equal(result.toString(),'historic\r\nsource\r\n');
  assert.equal(await readFile(file,'utf8'),'new version\n');
  await assert.rejects(readPinnedSourceBytes({...record,bodySha256:'f'.repeat(64)}),/exact|digest/i);
  await assert.rejects(readPinnedSourceBytes({...record,sourcePath:'../outside'}),/path/i);
  await assert.rejects(readPinnedSourceBytes({...record,head:'main'}),/commit/i);
});
