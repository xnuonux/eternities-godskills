import {readFile,writeFile,lstat,readdir} from 'node:fs/promises';
import {resolve,join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const here=fileURLToPath(new URL('.',import.meta.url)),repo=resolve(here,'../../..');
const rows=b=>b.toString().trim().split(/\r?\n/).map(JSON.parse);
const family=rows(await readFile(join(repo,'data/universal-product-v1/family-plan.jsonl'))).filter(r=>r.familyId==='knowledge-retrieval-memory');
const intake=rows(await readFile(join(repo,'data/quarry-intake-2026-09-21-exa/sources.jsonl')));
const ledger=[];
for(const row of family){
  const src=intake.find(s=>s.sourceId===row.sourceId);assert(src);assert.equal(src.bodySha256,row.bodySha256);
  const root=resolve(src.destination);assert(root.startsWith('D:\\03-ARSENAL\\warehouse\\'));
  const path=resolve(root,src.path),rel=relative(root,path);assert(!rel.startsWith('..'));assert(!(await lstat(path)).isSymbolicLink());
  const bytes=await readFile(path),hash=createHash('sha256').update(bytes).digest('hex');assert.equal(hash,row.bodySha256);
  const git=args=>execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();
  assert.equal(git(['rev-parse','HEAD']),src.commit);assert.equal(git(['hash-object',path]),src.gitBlob);assert.equal(git(['rev-parse',`${src.commit}:${src.path}`]),src.gitBlob);
  const licenseFiles=(await readdir(root)).filter(p=>/^(LICENSE|COPYING|NOTICE)(\.|$)/i.test(p));
  ledger.push({id:row.id,name:row.name,sourceId:src.sourceId,path,repositoryRoot:root,commit:src.commit,gitBlob:src.gitBlob,sha256:hash,bytes:bytes.length,licenseHint:src.licenseHint,licenseFiles:licenseFiles.map(p=>join(root,p)),classification:'unreviewed-source-body',authority:'none'});
}
assert.equal(ledger.length,4);
await writeFile(join(here,'source-integrity.json'),JSON.stringify({schema:'godskills-source-ledger-v1',family:'knowledge-retrieval-memory',sources:ledger},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({sources:ledger.length,bytes:ledger.reduce((n,s)=>n+s.bytes,0),ids:ledger.map(s=>s.id)}));
