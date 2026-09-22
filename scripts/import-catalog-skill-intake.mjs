import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {mkdir,readFile,readdir,realpath,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {makeSourceRecord,parseGitBatch,groupIntakeBodies,buildClassificationInputs,partitionSkillEntries} from '../src/catalog-skill-intake.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const warehouse='D:/03-ARSENAL/warehouse';
const operation=path.join(warehouse,'_operations/catalog-801-20260921-92ef3ca4');
const output=path.join(root,'data/quarry-intake-2026-09-21-catalog801');
const sha=b=>createHash('sha256').update(b).digest('hex');
const expected={
  'skill-entrypoints.json':'9257d6b04e555a2edbe4294eaf32bb8600d905838981f1b77c3183cd1f2e33c4',
  'final-verification.json':'3c4825da770828af7b90259ae41da9d3255cf8baa62292056459facfba42b6aa',
  'plan.json':'caa3b404a4e34281c79da3ed997eaa751fa7b99b3e0a82386ee4a853ff5723fd',
};
const gitEnv={...Object.fromEntries(Object.entries(process.env).filter(([k])=>!k.startsWith('GIT_'))),GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:process.platform==='win32'?'NUL':'/dev/null',GIT_NO_REPLACE_OBJECTS:'1',GIT_NO_LAZY_FETCH:'1',GIT_TERMINAL_PROMPT:'0'};
function git(cwd,args,input){return new Promise((resolve,reject)=>{
  const p=execFile('git',['-c','core.fsmonitor=false','-c','core.hooksPath=/dev/null',...args],{cwd,env:gitEnv,encoding:'buffer',maxBuffer:256*1024*1024,timeout:120000,windowsHide:true},(error,out,err)=>error?reject(new Error(`Git read failed: ${args[0]}: ${err?.toString().slice(0,500)}`,{cause:error})):resolve(out));
  p.stdin.on('error',()=>{});p.stdin.end(input);
});}
const envelopes={};
for(const [name,digest] of Object.entries(expected)){
  const bytes=await readFile(path.join(operation,name));assert.equal(sha(bytes),digest,`Changed operation evidence: ${name}`);envelopes[name]=JSON.parse(bytes);
}
assert.equal(envelopes['final-verification.json'].status,'pass');
const repositories=envelopes['skill-entrypoints.json'].rows.filter(x=>x.skillFiles.length);
assert.equal(repositories.length,95);assert.equal(repositories.reduce((n,r)=>n+r.skillFiles.length,0),9789);
const warehouseReal=await realpath(warehouse);
const licenses=new Map(envelopes['plan.json'].rows.map(x=>[x.canonical,x.licenseHint??null]));
const sources=[],repositoryReceipts=[],excludedEntries=[];
let next=0,done=0;
await Promise.all(Array.from({length:3},async()=>{
  while(next<repositories.length){
    const r=repositories[next++],repoReal=await realpath(r.path),relative=path.relative(warehouseReal,repoReal);
    assert(relative&&!relative.startsWith('..')&&!path.isAbsolute(relative),'Source outside warehouse');
    assert.equal((await git(repoReal,['rev-parse','HEAD'])).toString().trim(),r.head,`Changed source HEAD: ${r.repository}`);
    const remote=(await git(repoReal,['config','--get','remote.origin.url'])).toString().trim();
    assert.equal(remote.replace(/\.git$/,'').toLowerCase(),`https://github.com/${r.repository}`.toLowerCase(),'Source origin mismatch');
    const tree=(await git(repoReal,['ls-tree','-r','-l','-z',r.head])).toString('utf8');
    const {regular:declared,excluded}=partitionSkillEntries(tree,r.skillFiles);
    excludedEntries.push(...excluded.map(x=>({...x,repository:r.repository,commit:r.head})));
    const ids=[...new Set(declared.map(x=>x.oid))];
    const blobs=parseGitBatch(await git(repoReal,['cat-file','--batch'],ids.join('\n')+'\n'),ids);
    for(const entry of declared){const body=blobs.get(entry.oid);assert.equal(body.length,entry.bytes);sources.push(makeSourceRecord({repository:r,path:entry.path,gitBlob:entry.oid,body,licenseHint:licenses.get(r.repository)}));}
    repositoryReceipts.push({repository:r.repository,commit:r.head,sourceCount:declared.length,excludedNonRegular:excluded.length,uniqueGitBlobs:ids.length,originVerified:true,bodyHashesVerified:true,executedSourceCode:false});
    done++;if(done%10===0||done===repositories.length)console.log(JSON.stringify({repositoriesExtracted:done,total:repositories.length,sources:sources.length}));
  }
}));
sources.sort((a,b)=>a.sourceId.localeCompare(b.sourceId));
assert.equal(sources.length+excludedEntries.length,9789);
const prior=[],priorInputs=[];
for(const dir of (await readdir(path.join(root,'data'))).filter(x=>x.startsWith('quarry-intake-')&&x!==path.basename(output)).sort()){
  for(const file of ['sources.jsonl','source-cards.json']){
    const filename=path.join(root,'data',dir,file);let bytes;try{bytes=await readFile(filename);}catch(e){if(e.code==='ENOENT')continue;throw e;}
    const parsed=file.endsWith('.jsonl')?bytes.toString().trim().split(/\r?\n/).filter(Boolean).map(JSON.parse):JSON.parse(bytes);
    assert(Array.isArray(parsed));prior.push(...parsed);priorInputs.push({path:`data/${dir}/${file}`,sha256:sha(bytes),records:parsed.length});
  }
}
const historicalPath='data/corpus-reconciliation-v1/source-records.jsonl';
const historicalLocal=await realpath(path.resolve(process.env.GODSKILLS_PRIOR_CORPUS??path.join(root,historicalPath)));
const historical=await readFile(historicalLocal);
const historicalRows=historical.toString().trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
prior.push(...historicalRows.map(r=>({sourceId:r.sourceIdentity??r.recordId,bodySha256:r.bodySha256})));
priorInputs.push({path:historicalPath,localEvidencePath:historicalLocal.replaceAll('\\','/'),sha256:sha(historical),records:historicalRows.length});
const groups=groupIntakeBodies(sources,prior),inputs=buildClassificationInputs(groups);
const bodyGroups=groups.map(({aliases,...g})=>({...g,sourceIds:aliases.map(r=>r.sourceId)}));
const files={
  'excluded-entries.json':JSON.stringify(excludedEntries.sort((a,b)=>(a.repository+a.path).localeCompare(b.repository+b.path)),null,2)+'\n',
  'sources.jsonl':sources.map(x=>JSON.stringify(x)).join('\n')+'\n',
  'body-groups.jsonl':bodyGroups.map(x=>JSON.stringify(x)).join('\n')+'\n',
  'classification-inputs.jsonl':inputs.map(x=>JSON.stringify(x)).join('\n')+'\n',
  'repository-verification.json':JSON.stringify(repositoryReceipts.sort((a,b)=>a.repository.localeCompare(b.repository)),null,2)+'\n',
};
const manifest={schemaVersion:'catalog-skill-intake-v1',operationRoot:operation.replaceAll('\\','/'),operationInputs:expected,priorInputs,
  counts:{repositories:repositories.length,declaredEntrypoints:9789,sources:sources.length,excludedNonRegular:excludedEntries.length,uniqueBodies:groups.length,duplicateAliases:sources.length-groups.length,
    bodiesMatchingRecordedPrior:groups.filter(g=>g.recordedPriorAliases.length).length,newBodyHashes:groups.filter(g=>!g.recordedPriorAliases.length).length,
    classifierInputs:inputs.length,eligibleClassifierInputs:inputs.filter(x=>x.providerEligible).length,excludedClassifierInputs:inputs.filter(x=>!x.providerEligible).length,
    missingDescriptions:sources.filter(x=>!x.description).length,unsupportedEncodings:sources.filter(x=>x.encodingStatus!=='utf8').length},
  scope:'Git-blob integrity, exact-body deduplication and metadata extraction; no semantic equivalence, quality or licensing qualification',activation:'none',
  outputs:Object.fromEntries(Object.entries(files).map(([name,text])=>[name,{sha256:sha(text),bytes:Buffer.byteLength(text)}]))};
await mkdir(output,{recursive:true});
for(const [name,text] of Object.entries(files))await writeFile(path.join(output,name),text,{flag:'wx'});
await writeFile(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output,...manifest.counts}));
