import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {makeSourceRecord,parseGitBatch,groupIntakeBodies,buildClassificationInputs} from '../src/catalog-skill-intake.mjs';
import {verifySourceAccounting} from '../src/catalog-skill-intake.mjs';
const digest=b=>createHash('sha256').update(b).digest('hex');
const gitBlob=b=>createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
const repo={repository:'example/skills',head:'a'.repeat(40),path:'D:/warehouse/example'};
const body=Buffer.from('---\nname: soil-trial\ndescription: >\n  Compare soil samples\n  with controlled crop trials.\n---\n# Soil trial\n');
const record=(r=repo,p='soil/SKILL.md',b=body)=>makeSourceRecord({repository:r,path:p,gitBlob:gitBlob(b),body:b,licenseHint:'MIT'});
test('source records bind actual bytes to commit, blob and inert provenance',()=>{
 const r=record();assert.equal(r.sourceId,`example/skills@${'a'.repeat(40)}:soil/SKILL.md`);
 assert.equal(r.name,'soil-trial');assert.equal(r.description,'Compare soil samples with controlled crop trials.');
 assert.equal(r.bodySha256,digest(body));assert.equal(r.activation,'none');assert.equal(r.reviewStatus,'cold-unreviewed');
 assert.equal(r.body,undefined);assert.equal(r.bytes,body.length);
 assert.throws(()=>makeSourceRecord({repository:repo,path:'soil/SKILL.md',gitBlob:'f'.repeat(40),body}),/blob/i);
});
test('source paths cannot escape the declared repository or masquerade as entrypoints',()=>{
 for(const p of ['../SKILL.md','/SKILL.md','C:/SKILL.md','a\\SKILL.md','a/../SKILL.md','x/README.md'])assert.throws(()=>record(repo,p));
});
test('Git batch framing uses byte lengths instead of newlines inside a body',()=>{
 const raw=Buffer.from('first\nsecond\0\n');const id=gitBlob(raw);
 const parsed=parseGitBatch(Buffer.concat([Buffer.from(`${id} blob ${raw.length}\n`),raw,Buffer.from('\n')]),[id]);
 assert.deepEqual(parsed.get(id),raw);
 assert.throws(()=>parseGitBatch(Buffer.from(`${id} missing\n`),[id]));
 assert.throws(()=>parseGitBatch(Buffer.from(`${id} blob 999\nshort\n`),[id]));
 assert.throws(()=>parseGitBatch(Buffer.concat([Buffer.from(`${id} blob ${raw.length}\n`),raw,Buffer.from('\nextra')]),[id]));
});
test('exact-body grouping preserves aliases and recorded prior overlap without semantic claims',()=>{
 const a=record(),b=record({...repo,repository:'mirror/skills'}),c=record(repo,'other/SKILL.md',Buffer.from('# Other\nA different method.'));
 const grouped=groupIntakeBodies([a,b,c],[{bodySha256:a.bodySha256,sourceId:'old@rev:soil/SKILL.md'}]);
 assert.equal(grouped.length,2);const same=grouped.find(x=>x.bodySha256===a.bodySha256);
 assert.equal(same.aliases.length,2);assert.deepEqual(same.recordedPriorAliases,['old@rev:soil/SKILL.md']);
 assert.equal(same.bodyReview,false);assert.equal(same.semanticEquivalenceEstablished,false);
 assert.throws(()=>groupIntakeBodies([a,{...a,bodySha256:c.bodySha256}],[]),/conflict/i);
 assert.throws(()=>groupIntakeBodies([a,a],[]),/Duplicate source/);
});
test('identical selected metadata shares one classification input without merging different bodies',()=>{
 const a=record(),b=record(repo,'variant/SKILL.md',Buffer.concat([body,Buffer.from('Different instructions.\n')]));
 const inputs=buildClassificationInputs(groupIntakeBodies([a,b],[]));
 assert.equal(inputs.length,1);assert.equal(inputs[0].bodyHashes.length,2);
 assert.equal(inputs[0].inputSha256,digest(Buffer.from(inputs[0].text)));
 assert(!inputs[0].text.includes('Different instructions.'));
});
test('sensitive-looking metadata is excluded from provider input, not silently disclosed',()=>{
 const b=Buffer.from('---\nname: bad-example\ndescription: token sk-or-v1-'+ 'a'.repeat(48)+'\n---\n');
 const inputs=buildClassificationInputs(groupIntakeBodies([record(repo,'bad/SKILL.md',b)],[]));
 assert.equal(inputs[0].providerEligible,false);assert.equal(inputs[0].text,null);
 assert.equal(inputs[0].exclusion,'credential-like-selected-metadata');
});
test('credential detection happens before description or name clipping',()=>{
 const token='sk-or-v1-'+ 'a'.repeat(48);
 for(const text of [
  '---\nname: boundary\ndescription: '+ 'x'.repeat(681)+' '+token+'\n---\n',
  '---\nname: '+ 'x'.repeat(181)+' '+token+'\ndescription: source\n---\n',
  '---\nname: github-example\ndescription: github_pat_'+ 'a'.repeat(40)+'\n---\n',
 ]){
  const inputs=buildClassificationInputs(groupIntakeBodies([record(repo,'boundary/SKILL.md',Buffer.from(text))],[]));
  assert.equal(inputs[0].providerEligible,false);assert.equal(inputs[0].text,null);
 }
});
test('source accounting requires every regular and excluded identity exactly once',()=>{
 const a=record(),groups=[{bodySha256:a.bodySha256,sourceIds:[a.sourceId]}];
 assert.equal(verifySourceAccounting([a],groups,[],1),true);
 assert.throws(()=>verifySourceAccounting([a,a],groups,[],2),/Duplicate/);
 assert.throws(()=>verifySourceAccounting([a],[],[],1),/Missing/);
 assert.throws(()=>verifySourceAccounting([a],[...groups,...groups],[],1),/Repeated/);
});
import {partitionSkillEntries} from '../src/catalog-skill-intake.mjs';
test('declared symlink skill paths are accounted but never followed or parsed as instructions',()=>{
  const tree='100644 blob '+ 'a'.repeat(40)+' 4\tgood/SKILL.md\0'+'120000 blob '+'b'.repeat(40)+' 20\tlink/SKILL.md\0';
  const result=partitionSkillEntries(tree,['good/SKILL.md','link/SKILL.md']);
  assert.equal(result.regular.length,1);assert.equal(result.excluded.length,1);
  assert.equal(result.excluded[0].reason,'non-regular-git-entry-not-followed');
  assert.throws(()=>partitionSkillEntries(tree,['missing/SKILL.md']),/Missing declared/);
});
