import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {extractDescription} from './skill-description-repair.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const blobHash=b=>createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
const hashPattern=/^[a-f0-9]{64}$/;
const sensitive=/(?:sk-(?:or-v1-)?[A-Za-z0-9_-]{24,}|AKIA[A-Z0-9]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{20,})/;

export function partitionSkillEntries(tree,paths){
  const entries=new Map(tree.split('\0').filter(Boolean).map(line=>{
    const split=line.indexOf('\t');assert(split>=0,'Invalid Git tree entry');
    return[line.slice(split+1),line.slice(0,split).trim().split(/\s+/)];
  }));
  assert.equal(new Set(paths).size,paths.length,'Repeated declared path');
  const regular=[],excluded=[];
  for(const path of paths){const e=entries.get(path);assert(e,`Missing declared Git path: ${path}`);
    const entry={path,mode:e[0],type:e[1],oid:e[2],bytes:Number(e[3])};
    if(['100644','100755'].includes(e[0])&&e[1]==='blob')regular.push(entry);
    else excluded.push({...entry,reason:'non-regular-git-entry-not-followed',activation:'none'});
  }
  return{regular,excluded};
}

export function makeSourceRecord({repository,path,gitBlob,body,licenseHint=null}){
  assert(Buffer.isBuffer(body),'Source bytes required');
  assert(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository.repository),'Invalid repository');
  assert(/^[a-f0-9]{40}$/.test(repository.head),'Invalid commit');
  assert(typeof path==='string'&&!path.startsWith('/')&&!path.includes('\\')&&!path.includes(':')&&path.split('/').every(x=>x&&x!=='.'&&x!=='..')&&/(^|\/)SKILL\.md$/i.test(path),'Invalid source path');
  assert.equal(blobHash(body),gitBlob,'Git blob does not match source bytes');
  let text='',encodingStatus='utf8';
  try{text=new TextDecoder('utf-8',{fatal:true}).decode(body);}catch{encodingStatus='unsupported';}
  const description=extractDescription(text);
  const header=/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text)?.[1]??'';
  const names=[...header.matchAll(/^name\s*:\s*(.+)$/gm)];
  let name=names.length===1?names[0][1].trim():'';
  if(name.startsWith('"')){try{name=JSON.parse(name);}catch{name='';}}
  else if(/^'[^']*'$/.test(name))name=name.slice(1,-1);
  else if(/^[!&*\[\]{}>|#]/.test(name))name='';
  if(typeof name!=='string'||!name.trim())name=/^#\s+(.+)$/m.exec(text)?.[1]?.trim()??path.split('/').slice(-2,-1)[0]??repository.repository.split('/')[1];
  const metadataSensitive=sensitive.test(JSON.stringify({name,description:description.description??null}));
  return{sourceId:`${repository.repository}@${repository.head}:${path}`,repository:repository.repository,destination:repository.path,
    origin:`https://github.com/${repository.repository}.git`,commit:repository.head,path,gitBlob,bodySha256:sha(body),bytes:body.length,
    name:name.slice(0,200),description:description.status==='parsed'?description.description:null,descriptionStatus:description.status,encodingStatus,
    licenseHint,reviewStatus:'cold-unreviewed',activation:'none',sourceKind:'user-catalog-801-2026-09-21',...(metadataSensitive?{metadataSensitive:true}:{})};
}

export function parseGitBatch(bytes,objectIds){
  const result=new Map();let cursor=0;
  for(const expected of objectIds){
    const end=bytes.indexOf(10,cursor);assert(end>=cursor,'Missing Git batch header');
    const header=bytes.subarray(cursor,end).toString('ascii');
    const match=/^([a-f0-9]{40}) blob ([0-9]+)$/.exec(header);assert(match,'Invalid or missing Git blob');
    assert.equal(match[1],expected,'Unexpected Git object');const size=Number(match[2]);
    assert(Number.isSafeInteger(size)&&size>=0);cursor=end+1;
    assert(cursor+size<bytes.length&&bytes[cursor+size]===10,'Truncated Git blob');
    const body=bytes.subarray(cursor,cursor+size);assert.equal(blobHash(body),expected,'Corrupt Git blob');
    result.set(expected,body);cursor+=size+1;
  }
  assert.equal(cursor,bytes.length,'Unexpected trailing Git batch data');return result;
}

export function groupIntakeBodies(records,priorRecords){
  const identities=new Map(),groups=new Map(),prior=new Map();
  for(const r of priorRecords){if(!hashPattern.test(r.bodySha256??'')||typeof r.sourceId!=='string')continue;
    if(!prior.has(r.bodySha256))prior.set(r.bodySha256,new Set());prior.get(r.bodySha256).add(r.sourceId);}
  for(const r of records){assert(hashPattern.test(r.bodySha256));assert(typeof r.sourceId==='string'&&r.sourceId);
    if(identities.has(r.sourceId)){assert.equal(identities.get(r.sourceId),r.bodySha256,'Conflicting source identity');throw new Error('Duplicate source identity');}
    identities.set(r.sourceId,r.bodySha256);
    if(!groups.has(r.bodySha256))groups.set(r.bodySha256,[]);groups.get(r.bodySha256).push(r);
  }
  return [...groups].sort(([a],[b])=>a.localeCompare(b)).map(([bodySha256,aliases])=>({bodySha256,
    aliases:aliases.sort((a,b)=>a.sourceId.localeCompare(b.sourceId)),recordedPriorAliases:[...(prior.get(bodySha256)??[])].sort(),
    overlapStatus:prior.has(bodySha256)?'matches-recorded-prior-body':'not-in-recorded-prior-bodies',bodyReview:false,semanticEquivalenceEstablished:false}));
}

export function verifySourceAccounting(sources,groups,excluded,declared){
  assert.equal(sources.length+excluded.length,declared,'Declared path accounting mismatch');
  const index=new Map();for(const source of sources){assert(!index.has(source.sourceId),'Duplicate source identity');index.set(source.sourceId,source.bodySha256);}
  const represented=new Set();for(const group of groups)for(const id of group.sourceIds){
    assert(!represented.has(id),'Repeated grouped source');represented.add(id);assert.equal(index.get(id),group.bodySha256,'Unbound grouped source');
  }
  assert.equal(represented.size,index.size,'Missing grouped sources');
  const excludedIds=new Set();for(const entry of excluded){const id=`${entry.repository}@${entry.commit}:${entry.path}`;assert(!index.has(id)&&!excludedIds.has(id),'Repeated excluded source');excludedIds.add(id);}
  return true;
}

export function buildClassificationInputs(groups){
  const inputs=new Map();
  for(const group of groups){
    const source=group.aliases[0];const selected=JSON.stringify({name:source.name,description:source.description?.slice(0,700)??null});
    const inputSha256=sha(Buffer.from(selected)),eligible=!source.metadataSensitive&&!sensitive.test(JSON.stringify({name:source.name,description:source.description??null}));
    if(!inputs.has(inputSha256))inputs.set(inputSha256,{inputSha256,text:eligible?selected:null,providerEligible:eligible,
      exclusion:eligible?null:'credential-like-selected-metadata',bodyHashes:[],scope:'selected-metadata-only',descriptionClipped:Boolean(source.description?.length>700)});
    const input=inputs.get(inputSha256);input.bodyHashes.push(group.bodySha256);
    if(!eligible){input.providerEligible=false;input.text=null;input.exclusion='credential-like-selected-metadata';}
  }
  return [...inputs.values()].sort((a,b)=>a.inputSha256.localeCompare(b.inputSha256)).map(x=>({...x,bodyHashes:x.bodyHashes.sort()}));
}
