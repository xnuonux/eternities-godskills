import {readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {bindDomainChunk,mergeDomainRevisions} from '../src/universal-domain-review.mjs';
const root=new URL('../',import.meta.url), hash=b=>createHash('sha256').update(b).digest('hex');
const input=await readFile(new URL('data/quarry-intake-2026-09-21-exa/sources.jsonl',root));
const sources=input.toString('utf8').trim().split(/\r?\n/).map(JSON.parse),snapshot=hash(input);
const repairsBytes=await readFile(new URL('data/universal-product-v1/metadata-description-repairs.json',root));
const repairs=JSON.parse(repairsBytes),repairSnapshot=hash(repairsBytes),inputFiles=[];
if(repairs.sourceSnapshot!==snapshot)throw new Error('Description repairs are stale');
async function readLane(kind,bodyHashes,scopeSnapshot){
  const rows=[];
  for(const lane of ['a','b']){
    const name=`data/universal-product-v1/${kind}-${lane}/`,dir=new URL(name,root);
    let files;try{files=await readdir(dir);}catch(error){if(error.code==='ENOENT')continue;throw error;}
    for(const file of files.filter(x=>/^chunk-\d+\.jsonl?$/.test(x)).sort()){
      const bytes=await readFile(new URL(file,dir));
      if(file.endsWith('.jsonl'))rows.push(...bytes.toString('utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse));
      else{const chunk=JSON.parse(bytes);if(file!==`chunk-${chunk.offset}.json`)throw new Error('Chunk filename/offset mismatch');rows.push(...bindDomainChunk({bodyHashes,snapshot:scopeSnapshot,chunk}));}
      inputFiles.push({path:name+file,sha256:hash(bytes)});
    }
  }
  return rows;
}
const bodyHashes=sources.map(x=>x.bodySha256),repairHashes=repairs.repairs.map(x=>x.bodySha256),skillIds=await readdir(new URL('product/skills/',root));
const originalRows=await readLane('domain-review',bodyHashes,snapshot),repairRows=await readLane('domain-repair',repairHashes,repairSnapshot);
const result=mergeDomainRevisions({original:{bodyHashes,skillIds,snapshot,rows:originalRows},repair:{bodyHashes:repairHashes,skillIds,snapshot:repairSnapshot,rows:repairRows}});
const aliases=new Map();for(const row of sources){if(!aliases.has(row.bodySha256))aliases.set(row.bodySha256,[]);aliases.get(row.bodySha256).push(row);}
const queue=result.rows.map(row=>{
  const group=aliases.get(row.bodySha256),first=group[0];
  return {...row,sourceId:first.sourceId,name:first.name,aliasCount:group.length,bodyReview:'not-established-by-classification',nextAction:row.category==='unknown'?'inspect-source-body-to-resolve-metadata':row.gapLabel?'review-gap-against-product':'compare-source-method-before-distillation'};
});
const queueBytes=queue.map(x=>JSON.stringify(x)).join('\n')+'\n';
const summary={...result.summary,descriptionsStillMissing:repairs.unresolved.length,inputFiles,queueSha256:hash(queueBytes),queuePath:'data/universal-product-v1/refinement-queue.jsonl'};
await writeFile(new URL(summary.queuePath,root),queueBytes);
await writeFile(new URL('data/universal-product-v1/domain-refinement-summary.json',root),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({status:summary.status,reviewed:summary.reviewedBodies,remaining:summary.remainingBodies,remainingReclassification:summary.remainingReclassification,unknown:summary.unknownBodies}));
