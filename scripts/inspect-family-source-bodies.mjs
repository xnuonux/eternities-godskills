import {readFile,realpath,lstat,writeFile} from 'node:fs/promises';
import {resolve,relative,isAbsolute,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=new URL('../',import.meta.url),hash=b=>createHash('sha256').update(b).digest('hex');
const read=p=>readFile(new URL(p,root));
const lines=b=>b.toString('utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
const [warehouseArg,output,...extra]=process.argv.slice(2);
if(!warehouseArg||!output||extra.length)throw new Error('Usage: node scripts/inspect-family-source-bodies.mjs WAREHOUSE OUTPUT_JSON');
const warehouse=await realpath(warehouseArg);
const inside=(base,path)=>{const r=relative(base,path);return r!==''&&!isAbsolute(r)&&r!=='..'&&!r.startsWith('..'+sep);};
const sourceBytes=await read('data/quarry-intake-2026-09-21-exa/sources.jsonl'),sources=lines(sourceBytes);
const planBytes=await read('data/universal-product-v1/family-plan.jsonl'),plan=lines(planBytes);
const summary=JSON.parse(await read('data/universal-product-v1/family-plan-summary.json'));
if(hash(planBytes)!==summary.planSha256)throw new Error('Family plan hash mismatch');
const sourcesById=new Map();for(const row of sources){if(!sourcesById.has(row.sourceId))sourcesById.set(row.sourceId,[]);sourcesById.get(row.sourceId).push(row);}
const heads=new Map(),rows=[];
for(const item of plan){
  const candidates=(sourcesById.get(item.sourceId)??[]).filter(row=>row.bodySha256===item.bodySha256);
  const source=candidates.length===1?candidates[0]:undefined;
  const row={id:item.id,bodySha256:item.bodySha256,familyId:item.familyId,sourceId:source?.sourceId??item.sourceId,licenseHint:source?.licenseHint??null,modelBodyReview:false};
  try{
    if(candidates.length>1)throw new Error('ambiguous-source-record');
    if(!source)throw new Error('missing-source-record');
    const repo=await realpath(source.destination);
    if(!inside(warehouse,repo))throw new Error('repository-outside-warehouse');
    const requested=resolve(repo,source.path);
    if(!inside(repo,requested)||(await lstat(requested)).isSymbolicLink())throw new Error('invalid-source-path');
    const path=await realpath(requested);
    if(!inside(repo,path))throw new Error('source-outside-repository');
    if(!heads.has(repo))heads.set(repo,execFileSync('git',['-C',repo,'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim());
    const bytes=await readFile(path);
    if(hash(bytes)!==item.bodySha256)throw new Error('source-body-changed');
    if(heads.get(repo)!==source.commit){Object.assign(row,{sourceCommit:source.commit,currentCommit:heads.get(repo),commitMatches:false});throw new Error('source-commit-changed');}
    const content=bytes.toString('utf8').replace(/^\uFEFF/,''),body=content.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/,'');
    Object.assign(row,{status:'bytes-verified',sourceCommit:source.commit,currentCommit:heads.get(repo),commitMatches:heads.get(repo)===source.commit,bytes:bytes.length,bodyBytes:Buffer.byteLength(body),nonemptyBodyLines:body.split(/\r?\n/).filter(s=>s.trim()).length,headings:[...body.matchAll(/^#{1,4}\s+(.+)$/gm)].map(m=>m[1].trim()).slice(0,20)});
  }catch(error){Object.assign(row,{status:'unresolved',reason:error.message});}
  rows.push(row);
}
const report={schema:'godskills-family-source-observation-v1',sourceSnapshot:hash(sourceBytes),planSha256:hash(planBytes),authority:'none',activation:'none',note:'Deterministic byte observations only. Body size, headings and commit match do not establish quality, safety, novelty or model review.',rows};
await writeFile(resolve(output),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({observed:rows.length,verified:rows.filter(r=>r.status==='bytes-verified').length,unresolved:rows.filter(r=>r.status!=='bytes-verified').length,emptyBodies:rows.filter(r=>r.bodyBytes===0).length,under200BodyBytes:rows.filter(r=>r.bodyBytes<200).length,changedCommits:rows.filter(r=>r.commitMatches===false).length}));
