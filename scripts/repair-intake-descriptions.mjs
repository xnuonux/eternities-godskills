import {readFile,writeFile,realpath} from 'node:fs/promises';
import {resolve,relative,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {extractDescription} from '../src/skill-description-repair.mjs';

const root=new URL('../',import.meta.url), hash=b=>createHash('sha256').update(b).digest('hex');
const bytes=await readFile(new URL('data/quarry-intake-2026-09-21-exa/sources.jsonl',root));
const rows=bytes.toString('utf8').trim().split(/\r?\n/).map(JSON.parse);
const warehouse=await realpath('D:/03-ARSENAL/warehouse/hunt/exa-skills-2026-09-20');
const groups=new Map();
for(const row of rows){if(!groups.has(row.bodySha256))groups.set(row.bodySha256,[]);groups.get(row.bodySha256).push(row);}
const repairs=[],unresolved=[];
for(const [digest,aliases] of [...groups].sort(([a],[b])=>a<b?-1:a>b?1:0)){
  const row=aliases[0];
  if(row.description&&!/^[>|+-]+$/.test(row.description.trim()))continue;
  const identity={bodySha256:digest,sourceId:row.sourceId,repository:row.repository,path:row.path,name:row.name,previousDescription:row.description,aliasCount:aliases.length};
  try{
    const file=await realpath(resolve(row.destination,row.path)),rel=relative(warehouse,file);
    if(!rel||rel==='..'||rel.startsWith('..\\')||rel.startsWith('../')||isAbsolute(rel))throw new Error('Source outside admitted warehouse');
    const body=await readFile(file);if(hash(body)!==digest)throw new Error('Source digest changed');
    const parsed=extractDescription(body.toString('utf8'));
    if(parsed.status!=='parsed'){unresolved.push({...identity,status:parsed.status});continue;}
    repairs.push({...identity,description:parsed.description,status:'metadata-repaired',reviewRequired:true});
  }catch(error){unresolved.push({...identity,status:'unavailable',reason:error.message});}
}
const output={schema:'godskills-description-repair-v1',sourceSnapshot:hash(bytes),authority:'none',activation:'none',sourceBodiesModified:0,classificationLabelsRewritten:0,repairs,unresolved};
await writeFile(new URL('data/universal-product-v1/metadata-description-repairs.json',root),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({repaired:repairs.length,unresolved:unresolved.length,sourceSnapshot:output.sourceSnapshot}));
