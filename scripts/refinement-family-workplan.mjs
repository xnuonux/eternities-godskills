import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createFamilyPacket,assertSameFamilyPacket,bindFamilyChunk,summarizeFamilyPlan} from '../src/refinement-families.mjs';
const root=new URL('../',import.meta.url),base='data/universal-product-v1/';
const read=name=>readFile(new URL(name,root));
const json=async name=>JSON.parse(await read(name));
const hash=b=>createHash('sha256').update(b).digest('hex');
const lines=b=>b.toString('utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
const write=async(name,value)=>writeFile(new URL(name,root),JSON.stringify(value,null,2)+'\n');
const action=process.argv[2];
if(action==='packet'){
  const summary=await json(base+'domain-refinement-summary.json'),sourceBytes=await read('data/quarry-intake-2026-09-21-exa/sources.jsonl'),queueBytes=await read(base+'refinement-queue.jsonl');
  const repairs=await json(base+'metadata-description-repairs.json');
  if(hash(sourceBytes)!==summary.sourceSnapshot||hash(queueBytes)!==summary.queueSha256||repairs.sourceSnapshot!==summary.sourceSnapshot)throw new Error('Stale source, queue or description repairs');
  const descriptions=Object.create(null);
  for(const row of lines(sourceBytes))if(!Object.hasOwn(descriptions,row.bodySha256))descriptions[row.bodySha256]=row.description??'';
  for(const row of repairs.repairs)descriptions[row.bodySha256]=row.description;
  const familyData=await json(base+'refinement-families.json');
  if(familyData.schema!=='godskills-research-families-v1'||familyData.authority!=='none')throw new Error('Invalid research family boundary');
  const packet=createFamilyPacket({queue:lines(queueBytes),descriptions,families:familyData.families,skillIds:await readdir(new URL('product/skills/',root)),releaseId:(await json('product/release.json')).releaseId});
  try{assertSameFamilyPacket(await json(base+'family-packet.json'),packet);}catch(e){if(e.code!=='ENOENT')throw e;}
  await write(base+'family-packet.json',packet);
  console.log(JSON.stringify({snapshot:packet.snapshot,items:packet.items.length,families:packet.families.length}));
}else if(action==='slice'){
  const packet=await json(base+'family-packet.json'),offset=Number(process.argv[3]??0),limit=Number(process.argv[4]??64);
  if(!Number.isSafeInteger(offset)||offset<0||!Number.isSafeInteger(limit)||limit<1||limit>64)throw new Error('Invalid bounded slice');
  console.log(JSON.stringify({snapshot:packet.snapshot,total:packet.items.length,offset,items:packet.items.slice(offset,offset+limit)}));
}else if(action==='build'){
  const packet=await json(base+'family-packet.json'),rows=[],inputs=[];
  for(const lane of ['a','b']){
    const name=base+`family-review-${lane}/`;let files;
    try{files=await readdir(new URL(name,root));}catch(e){if(e.code==='ENOENT')continue;throw e;}
    for(const file of files.filter(f=>/^chunk-\d+\.json$/.test(f)).sort()){
      const bytes=await read(name+file),chunk=JSON.parse(bytes);
      if(file!==`chunk-${chunk.offset}.json`)throw new Error('Chunk filename/offset mismatch');
      rows.push(...bindFamilyChunk(packet,chunk));inputs.push({path:name+file,sha256:hash(bytes)});
    }
  }
  const plan=summarizeFamilyPlan(packet,rows),{rows:planRows,...summary}=plan;
  await writeFile(new URL(base+'family-plan.jsonl',root),planRows.map(x=>JSON.stringify(x)).join('\n')+'\n');
  await write(base+'family-plan-summary.json',{...summary,inputs,planSha256:hash(await read(base+'family-plan.jsonl'))});
  const overview=['# Research-family index','','Metadata organization only; no source-body coverage or automatic promotion.','',`Baseline packet: ${packet.snapshot}.`,`${summary.summary.assigned} of ${summary.summary.total} leads assigned; ${summary.summary.remaining} unassigned.`,
    '', '| Family | Leads | Method candidates | Owner extensions | Platform adapters | Unclear |','| --- | ---: | ---: | ---: | ---: | ---: |',
    ...summary.families.map(f=>`| ${f.familyId} | ${f.total} | ${f.dispositions['method-candidate']} | ${f.dispositions['owner-extension']} | ${f.dispositions['platform-adapter']} | ${f.dispositions.unclear} |`),
    '', 'See [family definitions](refinement-families.json) for scope and adjacent owner IDs, and [the workplan rows](family-plan.jsonl) for exact source-body bindings and rationale. Related owners do not establish complete coverage.',''];
  await writeFile(new URL(base+'FAMILY-INDEX.md',root),overview.join('\n'));
  console.log(JSON.stringify(summary.summary));
}else throw new Error('Use packet, slice [offset] [limit], or build');
