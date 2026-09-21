import {readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {summarizeDomainReview,bindDomainChunk} from '../src/universal-domain-review.mjs';
const root=new URL('../',import.meta.url);
const input=await readFile(new URL('data/quarry-intake-2026-09-21-exa/sources.jsonl',root),'utf8');
const snapshot=createHash('sha256').update(input).digest('hex');
const bodyHashes=input.trim().split(/\r?\n/).map(x=>JSON.parse(x).bodySha256);
const rows=[],inputFiles=[];
for(const lane of ['a','b']){
  const dir=new URL(`data/universal-product-v1/domain-review-${lane}/`,root);
  let files;try{files=await readdir(dir);}catch(e){if(e.code==='ENOENT')continue;throw e;}
  for(const file of files.filter(x=>/^chunk-\d+\.jsonl?$/.test(x)).sort()){
    const bytes=await readFile(new URL(file,dir),'utf8');
    if(file.endsWith('.jsonl'))rows.push(...bytes.trim().split(/\r?\n/).filter(Boolean).map(JSON.parse));
    else {const chunk=JSON.parse(bytes);if(file!==`chunk-${chunk.offset}.json`)throw new Error('Chunk filename/offset mismatch');rows.push(...bindDomainChunk({bodyHashes,snapshot,chunk}));}
    inputFiles.push({path:`data/universal-product-v1/domain-review-${lane}/${file}`,sha256:createHash('sha256').update(bytes).digest('hex')});
  }
}
const summary=summarizeDomainReview({bodyHashes,skillIds:await readdir(new URL('product/skills/',root)),snapshot,rows});
await writeFile(new URL('data/universal-product-v1/domain-review-summary.json',root),JSON.stringify({...summary,inputFiles},null,2)+'\n');
console.log(JSON.stringify({status:summary.status,reviewed:summary.reviewedBodies,remaining:summary.remainingBodies,unknown:summary.unknownBodies}));
