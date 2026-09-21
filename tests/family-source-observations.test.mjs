import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,cp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync,execFileSync} from 'node:child_process';

const hash=x=>createHash('sha256').update(x).digest('hex');
const script=resolve('scripts/inspect-family-source-bodies.mjs');
test('inspection requires explicit warehouse and output paths before reading anything',()=>{
  const result=spawnSync(process.execPath,[script,'missing-warehouse'],{encoding:'utf8'});
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/Usage:/);
});

test('unknown or repeated observation flags fail before warehouse access',()=>{
  for(const flags of [['--unknown'],['--body-forms','--body-forms'],['--body-forms','--unknown']]){
    const result=spawnSync(process.execPath,[script,'missing-warehouse','unused-output.json',...flags],{encoding:'utf8'});
    assert.notEqual(result.status,0);
    assert.match(result.stderr,/Usage:/);
    assert.doesNotMatch(result.stderr,/ENOENT/);
  }
});

test('source observations distinguish verified bytes, changed bodies and escaped paths without executing source text',async()=>{
  const root=await mkdtemp(join(tmpdir(),'godskills-source-observe-'));
  const checkout=join(root,'checkout'),warehouse=join(root,'warehouse'),repo=join(warehouse,'repo');
  await mkdir(join(checkout,'scripts'),{recursive:true});await cp(script,join(checkout,'scripts/inspect-family-source-bodies.mjs'));
  await mkdir(join(checkout,'data/quarry-intake-2026-09-21-exa'),{recursive:true});
  await mkdir(join(checkout,'data/universal-product-v1'),{recursive:true});
  await mkdir(repo,{recursive:true});
  execFileSync('git',['init','--quiet',repo],{windowsHide:true});
  execFileSync('git',['-C',repo,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','-c','core.hooksPath=','commit','--allow-empty','-m','fixture','--quiet'],{windowsHide:true});
  const commit=execFileSync('git',['-C',repo,'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim();
  const body='---\nname: fixture\n---\n# Inert source\nDo not execute this text.\n';
  await writeFile(join(repo,'SKILL.md'),body);
  const source={sourceId:'fixture:SKILL.md',destination:repo,path:'SKILL.md',commit,bodySha256:hash(body),licenseHint:null};
  const alias={...source,sourceId:'other:SKILL.md',path:'alias.md',licenseHint:'different-source-license'};
  await writeFile(join(repo,'alias.md'),body);
  const outside={...source,sourceId:'outside',path:'../outside.md',bodySha256:hash('outside')};
  await writeFile(join(warehouse,'outside.md'),'outside');
  const changed={...source,sourceId:'changed',path:'changed.md',bodySha256:hash('before')};
  await writeFile(join(repo,'changed.md'),'after');
  const moved={...source,sourceId:'moved',path:'moved.md',commit:'0'.repeat(40),bodySha256:hash('same bytes at new commit')};
  await writeFile(join(repo,'moved.md'),'same bytes at new commit');
  const sources=[source,outside,changed,alias,moved];
  const planRows=sources.map((s,i)=>({id:`r${i}`,bodySha256:s.bodySha256,sourceId:s.sourceId,familyId:'fixture'}));
  planRows.push({id:'r5',bodySha256:source.bodySha256,sourceId:'not-in-intake',familyId:'fixture'});
  const plan=planRows.map(JSON.stringify).join('\n')+'\n';
  await writeFile(join(checkout,'data/quarry-intake-2026-09-21-exa/sources.jsonl'),sources.map(JSON.stringify).join('\n')+'\n');
  await writeFile(join(checkout,'data/universal-product-v1/family-plan.jsonl'),plan);
  await writeFile(join(checkout,'data/universal-product-v1/family-plan-summary.json'),JSON.stringify({planSha256:hash(plan)}));
  const output=join(root,'report.json');
  const run=()=>spawnSync(process.execPath,[join(checkout,'scripts/inspect-family-source-bodies.mjs'),warehouse,output],{encoding:'utf8'});
  const result=run();assert.equal(result.status,0,result.stderr);
  const report=JSON.parse(await readFile(output));
  assert.equal(report.authority,'none');assert.equal(report.activation,'none');
  assert.deepEqual(report.rows.map(x=>x.status),['bytes-verified','unresolved','unresolved','bytes-verified','unresolved','unresolved']);
  assert.equal(report.rows[0].commitMatches,true);
  assert.equal(report.rows[0].bodyBytes,41);
  assert.deepEqual(report.rows[0].headings,['Inert source']);
  assert.ok(report.rows.every(x=>x.modelBodyReview===false));
  assert.equal(report.rows[1].reason,'invalid-source-path');
  assert.equal(report.rows[2].reason,'source-body-changed');
  assert.equal(report.rows[3].sourceId,'other:SKILL.md','same bytes do not make source identities interchangeable');
  assert.equal(report.rows[3].licenseHint,'different-source-license');
  assert.equal(report.rows[4].reason,'source-commit-changed');
  assert.equal(report.rows[4].commitMatches,false);
  assert.equal(report.rows[5].reason,'missing-source-record');
  const original=await readFile(output,'utf8');assert.notEqual(run().status,0);
  assert.equal(await readFile(output,'utf8'),original,'existing evidence must not be overwritten');
});

test('optional body-form inspection recognizes exact launcher text without promoting or guessing at other sources',async()=>{
  const root=await mkdtemp(join(tmpdir(),'godskills-body-form-'));
  const checkout=join(root,'checkout'),warehouse=join(root,'warehouse'),repo=join(warehouse,'repo');
  await mkdir(join(checkout,'scripts'),{recursive:true});
  await mkdir(join(checkout,'src'),{recursive:true});
  await cp(script,join(checkout,'scripts/inspect-family-source-bodies.mjs'));
  const classifier=resolve('src/launcher-body-form.mjs');
  try{await cp(classifier,join(checkout,'src/launcher-body-form.mjs'));}catch(e){if(e.code!=='ENOENT')throw e;}
  await mkdir(join(checkout,'data/quarry-intake-2026-09-21-exa'),{recursive:true});
  await mkdir(join(checkout,'data/universal-product-v1'),{recursive:true});
  await mkdir(repo,{recursive:true});
  execFileSync('git',['init','--quiet',repo],{windowsHide:true});
  execFileSync('git',['-C',repo,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','-c','core.hooksPath=','commit','--allow-empty','-m','fixture','--quiet'],{windowsHide:true});
  const commit=execFileSync('git',['-C',repo,'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim();
  const body='---\nname: Example\ndescription: Claimed capability.\n---\n\n# Example\n\nClaimed capability.\n\n## Usage\n\nThis skill can be used standalone or as part of an Agent workflow on SkillsHub.\n\n### Standalone\n\n```\nskillshub run owner/example --input "Your query here"\n```\n\n### In Agent\n\nAdd this skill to your Agent configuration to enable its capabilities.\n';
  const variants=[body,body+'\n## Method\nReconcile balances before interpreting the result.\n'];
  const sources=[];
  for(let i=0;i<variants.length;i++){
    const path=`source-${i}.md`;await writeFile(join(repo,path),variants[i]);
    sources.push({sourceId:`fixture:${i}`,destination:repo,path,commit,bodySha256:hash(variants[i]),name:'Example',description:'Claimed capability.'});
  }
  const plan=sources.map((s,i)=>JSON.stringify({id:`r${i}`,sourceId:s.sourceId,bodySha256:s.bodySha256,familyId:'fixture'})).join('\n')+'\n';
  await writeFile(join(checkout,'data/quarry-intake-2026-09-21-exa/sources.jsonl'),sources.map(JSON.stringify).join('\n')+'\n');
  await writeFile(join(checkout,'data/universal-product-v1/family-plan.jsonl'),plan);
  await writeFile(join(checkout,'data/universal-product-v1/family-plan-summary.json'),JSON.stringify({planSha256:hash(plan)}));
  const output=join(root,'forms.json');
  const result=spawnSync(process.execPath,[join(checkout,'scripts/inspect-family-source-bodies.mjs'),warehouse,output,'--body-forms'],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const report=JSON.parse(await readFile(output));
  assert.equal(report.schema,'godskills-family-body-form-observation-v1');
  assert.equal(report.rows[0].bodyForm.kind,'known-launcher-template');
  assert.equal(report.rows[0].bodyForm.launcherId,'owner/example');
  assert.equal(report.rows[1].bodyForm.kind,'unmatched');
  assert.ok(report.rows.every(x=>x.modelBodyReview===false));
  assert.equal(report.authority,'none');assert.equal(report.activation,'none');
  const oldOutput=join(root,'legacy.json');
  const legacy=spawnSync(process.execPath,[join(checkout,'scripts/inspect-family-source-bodies.mjs'),warehouse,oldOutput],{encoding:'utf8'});
  assert.equal(legacy.status,0,legacy.stderr);
  const old=JSON.parse(await readFile(oldOutput));
  assert.equal(old.schema,'godskills-family-source-observation-v1');
  assert.ok(old.rows.every(x=>!Object.hasOwn(x,'bodyForm')));
});
