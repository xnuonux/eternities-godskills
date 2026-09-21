import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, cp, readdir, symlink, link, unlink } from 'node:fs/promises';
import {createHash} from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildProduct, verifyProduct, verifySkillDirectory, searchCatalog, installProduct, rollbackInstall } from '../product/lib/product.mjs';

const fixture = async () => {
  const root = await mkdtemp(join(tmpdir(), 'godskills-contract-'));
  const pack = join(root, 'pack');
  await mkdir(pack);
  const skills = [
    {id:'build', category:'engineering', summary:'Implement software from a settled contract', triggers:['implement software', 'change program'], taskTypes:['build'], related:['debug']},
    {id:'debug', category:'engineering', summary:'Diagnose crashes from evidence and verify a repair', triggers:['debug a crash', 'diagnose broken application'], taskTypes:['recover'], related:['build']},
    {id:'audio-check', category:'audio', summary:'Test digital audio DSP for discontinuity and unstable feedback', triggers:['audio DSP', 'sample rate discontinuity', 'unstable feedback'], taskTypes:['verify'], related:['build'], specializes:'build'},
  ];
  for (const item of skills) {
    const dir = join(pack,'skills',item.id);
    await mkdir(join(dir,'references'), {recursive:true});
    await writeFile(join(dir,'SKILL.md'), `---\nname: ${item.id}\ndescription: ${item.summary}\n---\n\n# ${item.id}\n\nRead [method](references/method.md) for the working method.\n`);
    await writeFile(join(dir,'references/method.md'), 'A standalone test method.\n');
    await writeFile(join(dir,'skill.json'), JSON.stringify({...item,antiTriggers:[], resources:['references/method.md'], maturity:'instruction-reviewed',provenance:[{kind:'original',source:'test-fixture',note:'No performance claim'}]}));
  }
  return {root,pack};
};

test('portable content identity is unchanged by checkout location', async () => {
  const {root,pack}=await fixture();
  const first=await buildProduct(pack);
  const elsewhere=join(root,'elsewhere'); await cp(pack,elsewhere,{recursive:true});
  const second=await buildProduct(elsewhere);
  assert.equal(first.releaseId,second.releaseId);
  assert.equal((await verifyProduct(elsewhere)).skillCount,3);
  assert.doesNotMatch(await readFile(join(pack,'catalog.json'),'utf8'), /godskills-contract-/);
});

test('specialist discovery works and returns reasons, not activation',async()=>{
  const {pack}=await fixture(); await buildProduct(pack);
  const catalog=JSON.parse(await readFile(join(pack,'catalog.json'),'utf8'));
  const found=searchCatalog(catalog,'sample rate discontinuity in audio DSP',{limit:2});
  assert.equal(found.results[0].id,'audio-check');
  assert.equal(found.results[0].entrypoint,'skills/audio-check/SKILL.md');
  assert.ok(found.results[0].reasons.length);
  assert.equal(found.authority,'none');
  assert.equal(found.activation,'none');
  assert.equal(found.results.length,1);
  assert.deepEqual(found,searchCatalog(catalog,'sample rate discontinuity in audio DSP',{limit:2}));
  assert.equal(searchCatalog(catalog,'zzqv zzkx').results.length,0);
  assert.throws(()=>searchCatalog(catalog,'audio',{limit:0}),/limit/i);
  assert.throws(()=>searchCatalog(catalog,'x'.repeat(4097)),/query/i);
});

test('changed bytes and extra undeclared files invalidate a built release',async()=>{
  const {pack}=await fixture(); await buildProduct(pack);
  await writeFile(join(pack,'skills/build/SKILL.md'),'altered');
  await assert.rejects(verifyProduct(pack),/digest|hash|changed/i);
  const second=await fixture(); await buildProduct(second.pack);
  await writeFile(join(second.pack,'surprise.mjs'),'process.exit(1)');
  await assert.rejects(verifyProduct(second.pack),/file set|undeclared/i);
});

test('missing resources, dangling relations, path escape, and metadata mismatch fail validation',async()=>{
  for (const mutation of [
    x=>{x.resources=['../escape.md'];},
    x=>{x.resources=['references/missing.md'];},
    x=>{x.related=['not-present'];},
    x=>{x.id='other';},
    x=>{x.maturity='universally-superior';},
  ]) {
    const {pack}=await fixture(); const path=join(pack,'skills/build/skill.json');
    const meta=JSON.parse(await readFile(path,'utf8')); mutation(meta); await writeFile(path,JSON.stringify(meta));
    await assert.rejects(buildProduct(pack));
  }
});

test('installer preserves unrelated skills, backs up replacements, and rolls back exact bytes',async()=>{
  const {root,pack}=await fixture(); await buildProduct(pack);
  const target=join(root,'agent-skills'), runtime=join(root,'runtime'), backup=join(root,'backup');
  await mkdir(join(target,'build'),{recursive:true}); await writeFile(join(target,'build','personal.md'),'my previous version');
  await mkdir(join(target,'unrelated')); await writeFile(join(target,'unrelated','SKILL.md'),'keep this');
  const result=await installProduct(pack,{skillsDir:target,runtimeDir:runtime,backupDir:backup});
  assert.equal(await readFile(join(target,'unrelated','SKILL.md'),'utf8'),'keep this');
  assert.equal(await readFile(join(backup,'previous-skills','build','personal.md'),'utf8'),'my previous version');
  assert.equal((await verifyProduct(runtime)).releaseId,result.releaseId);
  assert.equal(await readFile(join(target,'debug','SKILL.md'),'utf8'),await readFile(join(pack,'skills/debug','SKILL.md'),'utf8'));
  await rollbackInstall(result.receiptPath);
  assert.equal(await readFile(join(target,'build','personal.md'),'utf8'),'my previous version');
  assert.deepEqual((await readdir(target)).sort(),['build','unrelated']);
});

test('rollback refuses to overwrite a skill edited after installation',async()=>{
  const {root,pack}=await fixture(); await buildProduct(pack);
  const target=join(root,'agent-skills');
  const result=await installProduct(pack,{skillsDir:target,runtimeDir:join(root,'runtime'),backupDir:join(root,'backup')});
  await writeFile(join(target,'debug','SKILL.md'),'user changed this');
  await assert.rejects(rollbackInstall(result.receiptPath),/changed|modified/i);
  assert.equal(await readFile(join(target,'debug','SKILL.md'),'utf8'),'user changed this');
});

test('installer rejects overlapping roots and does not reuse a backup directory',async()=>{
  const {root,pack}=await fixture(); await buildProduct(pack);
  await assert.rejects(installProduct(pack,{skillsDir:pack,runtimeDir:join(root,'r'),backupDir:join(root,'b')}),/overlap/i);
  const options={skillsDir:join(root,'s'),runtimeDir:join(root,'r'),backupDir:join(root,'b')};
  await installProduct(pack,options);
  await assert.rejects(installProduct(pack,options),/backup.*exist/i);
});

test('real product CLI works from a copied pack and a minimal environment',async()=>{
  const root=await mkdtemp(join(tmpdir(),'godskills-clean-room-'));
  const pack=join(root,'portable');
  await cp(resolve('product'),pack,{recursive:true});
  await buildProduct(pack);
  const result=spawnSync(process.execPath,[join(pack,'bin/godskills.mjs'),'search','audio signal discontinuity','--limit','3'],{cwd:root,encoding:'utf8',env:{SystemRoot:process.env.SystemRoot ?? '',PATH:''}});
  assert.equal(result.status,0,result.stderr);
  const output=JSON.parse(result.stdout);
  assert.ok(output.results.some(x=>x.id==='audio-dsp-integrity-review'));
  assert.equal(output.authority,'none');
});

test('portable metadata rejects unrecognized task types',async()=>{
  const {pack}=await fixture();
  const dir=join(pack,'skills/build'),meta=JSON.parse(await readFile(join(dir,'skill.json'),'utf8'));
  meta.taskTypes=['made-up-stage'];await writeFile(join(dir,'skill.json'),JSON.stringify(meta));
  await assert.rejects(buildProduct(pack),/task type/i);
});

test('installer refuses a junction that would redirect a target outside its named directory',async()=>{
  const {root,pack}=await fixture();await buildProduct(pack);
  const outside=join(root,'outside'),linked=join(root,'linked');await mkdir(outside);
  await symlink(outside,linked,process.platform==='win32'?'junction':'dir');
  await assert.rejects(installProduct(pack,{skillsDir:linked,runtimeDir:join(root,'runtime'),backupDir:join(root,'backup')}),/link/i);
  assert.deepEqual(await readdir(outside),[]);
});

test('installer never replaces an unrelated existing runtime directory',async()=>{
  const {root,pack}=await fixture();await buildProduct(pack);
  const runtime=join(root,'important-folder');await mkdir(runtime);await writeFile(join(runtime,'document.txt'),'user data');
  await assert.rejects(installProduct(pack,{skillsDir:join(root,'s'),runtimeDir:runtime,backupDir:join(root,'b')}),/existing runtime/i);
  assert.equal(await readFile(join(runtime,'document.txt'),'utf8'),'user data');
});

test('staged skill bytes must match the approved release, not merely their own new hash',async()=>{
  const {root,pack}=await fixture();const release=await buildProduct(pack);
  const staged=join(root,'stage');await cp(join(pack,'skills/build'),staged,{recursive:true});
  await verifySkillDirectory(staged,'build',release);
  await writeFile(join(staged,'SKILL.md'),'concurrent source edit');
  await assert.rejects(verifySkillDirectory(staged,'build',release),/release|staged/i);
});

test('rollback refuses an occupied runtime recovery destination before moving skills',async()=>{
  const {root,pack}=await fixture();await buildProduct(pack);
  const target=join(root,'skills'),runtime=join(root,'runtime'),backup=join(root,'backup');
  const installed=await installProduct(pack,{skillsDir:target,runtimeDir:runtime,backupDir:backup});
  await writeFile(join(backup,'rolled-back-runtime'),'USER-SENTINEL');
  await assert.rejects(rollbackInstall(installed.receiptPath),/destination|exist/i);
  assert.equal(await readFile(join(backup,'rolled-back-runtime'),'utf8'),'USER-SENTINEL');
  assert.equal(await readFile(join(target,'build','SKILL.md'),'utf8'),await readFile(join(pack,'skills/build/SKILL.md'),'utf8'));
});

async function rebind(pack,paths){
  const release=JSON.parse(await readFile(join(pack,'release.json'),'utf8'));
  for(const path of paths)release.files[path]=createHash('sha256').update(await readFile(join(pack,path))).digest('hex');
  release.releaseId=createHash('sha256').update(JSON.stringify(release.files,null,2)+'\n').digest('hex');
  await writeFile(join(pack,'release.json'),JSON.stringify(release));return release;
}
test('self-consistent hashes cannot hide missing catalog entries or invalid metadata',async()=>{
  const {pack}=await fixture();await buildProduct(pack);
  const c=JSON.parse(await readFile(join(pack,'catalog.json'),'utf8'));c.skills=[];await writeFile(join(pack,'catalog.json'),JSON.stringify(c));
  const release=await rebind(pack,['catalog.json']);release.skillCount=0;await writeFile(join(pack,'release.json'),JSON.stringify(release));
  await assert.rejects(verifyProduct(pack),/catalog/i);
  const second=await fixture();await buildProduct(second.pack);
  const path=join(second.pack,'skills/build/skill.json');const meta=JSON.parse(await readFile(path,'utf8'));meta.maturity='universally-superior';await writeFile(path,JSON.stringify(meta));
  await rebind(second.pack,['skills/build/skill.json']);await assert.rejects(verifyProduct(second.pack),/maturity|catalog|metadata/i);
});
test('a root __proto__ file is included in integrity checks',async()=>{
  const {pack}=await fixture();await writeFile(join(pack,'__proto__'),'approved');await buildProduct(pack);
  await writeFile(join(pack,'__proto__'),'changed');await assert.rejects(verifyProduct(pack),/digest|changed/i);
});
test('exact declared negative phrases exclude discovery without granting authority',()=>{
  const c={schema:'eternities-godskills-catalog-v1',skills:[{id:'release-check',category:'release',summary:'Production deployment',triggers:['production deployment'],antiTriggers:['production deployment without approval'],taskTypes:['build'],related:[],maturity:'instruction-reviewed',entrypoint:'skills/release-check/SKILL.md',entrypointSha256:'a'.repeat(64)}]};
  assert.equal(searchCatalog(c,'production deployment without approval').results.length,0);
  assert.equal(searchCatalog(c,'production deployment').results.length,1);
});
test('platform-reserved path components cannot enter a portable release',async()=>{
  const {pack}=await fixture();await writeFile(join(pack,'CON.txt'),'bad portable name');
  await assert.rejects(buildProduct(pack),/path|reserved|portable/i);
});
test('manifest generation never overwrites an outside file through a hardlink',async()=>{
  const {root,pack}=await fixture();await buildProduct(pack);
  const outside=join(root,'outside.txt');await writeFile(outside,'USER-SENTINEL');
  await unlink(join(pack,'catalog.json'));await link(outside,join(pack,'catalog.json'));
  await assert.rejects(buildProduct(pack),/link/i);
  assert.equal(await readFile(outside,'utf8'),'USER-SENTINEL');
});

test('different-volume commit destinations are rejected before any skills move',{skip:!process.env.GODSKILLS_TEST_SECOND_VOLUME},async()=>{
  const {root,pack}=await fixture();await buildProduct(pack);
  const other=await mkdtemp(join(process.env.GODSKILLS_TEST_SECOND_VOLUME,'godskills-volume-test-'));
  const skills=join(root,'skills');await mkdir(join(skills,'build'),{recursive:true});await writeFile(join(skills,'build','old.txt'),'preserve');
  await assert.rejects(installProduct(pack,{skillsDir:skills,runtimeDir:join(other,'runtime'),backupDir:join(root,'backup')}),/volume|device/i);
  assert.deepEqual(await readdir(join(skills,'build')),['old.txt']);
});
