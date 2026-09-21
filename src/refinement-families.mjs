import {createHash} from 'node:crypto';

export const dispositions=['method-candidate','owner-extension','platform-adapter','unclear'];
const hashPattern=/^[a-f0-9]{64}$/;
const idPattern=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function check(condition,message){if(!condition)throw new Error(message);}
function text(value,label,max=4000){check(typeof value==='string'&&value.trim().length>0&&value.length<=max,`invalid ${label}`);return value;}
function digest(value){return createHash('sha256').update(JSON.stringify(value)).digest('hex');}
function compare(a,b){return a<b?-1:a>b?1:0;}

/** Metadata-only organization. Adjacent owners do not establish source coverage. */
export function createFamilyPacket({queue,descriptions={},families,skillIds,releaseId}){
  check(hashPattern.test(releaseId),'invalid releaseId');
  check(Array.isArray(queue)&&Array.isArray(families)&&Array.isArray(skillIds),'invalid packet arrays');
  const owners=new Set(skillIds),seenFamilies=new Set(),seenBodies=new Set();
  const definitions=families.map(f=>{
    check(idPattern.test(f.id)&&!seenFamilies.has(f.id),'invalid or duplicate family');seenFamilies.add(f.id);
    check(Array.isArray(f.ownerIds)&&new Set(f.ownerIds).size===f.ownerIds.length,'invalid ownerIds');
    for(const id of f.ownerIds)check(owners.has(id),`unknown owner ${id}`);
    return {id:f.id,scope:text(f.scope,'family scope'),ownerIds:[...f.ownerIds].sort(compare)};
  }).sort((a,b)=>compare(a.id,b.id));
  const sourceRows=queue.map(row=>{
    check(hashPattern.test(row.bodySha256),'invalid body hash');
    check(!seenBodies.has(row.bodySha256),'duplicate body');seenBodies.add(row.bodySha256);
    const description=Object.hasOwn(descriptions,row.bodySha256)?descriptions[row.bodySha256]:'';
    check(typeof description==='string'&&description.length<=12000,'invalid description');
    check(row.gapLabel===null||typeof row.gapLabel==='string','invalid gap label');
    check(row.name===null||row.name===undefined||typeof row.name==='string','invalid name');
    return {bodySha256:row.bodySha256,sourceId:text(row.sourceId,'sourceId'),name:row.name??null,category:text(row.category,'category'),gapLabel:row.gapLabel,description};
  }).sort((a,b)=>compare(a.bodySha256,b.bodySha256));
  const items=sourceRows.filter(row=>row.gapLabel||row.category==='unknown').map((row,i)=>({id:`r${String(i).padStart(4,'0')}`,...row}));
  const content={schema:'godskills-family-packet-v1',authority:'none',activation:'none',releaseId,totalQueueBodies:sourceRows.length,queueDigest:digest(sourceRows),families:definitions,items};
  return {...content,snapshot:digest(content)};
}

function validatePacket(packet){
  check(packet&&typeof packet==='object','invalid packet');
  const {snapshot,...content}=packet;
  check(hashPattern.test(snapshot)&&snapshot===digest(content),'packet snapshot mismatch');
  check(packet.schema==='godskills-family-packet-v1'&&packet.authority==='none'&&packet.activation==='none','invalid packet boundary');
}
export function assertSameFamilyPacket(existing,candidate){
  validatePacket(existing);validatePacket(candidate);
  check(existing.snapshot===candidate.snapshot,'frozen family packet mismatch; create a new versioned review batch');
}
function validateAssignment(packet,familyId,disposition,reason){
  check(packet.families.some(f=>f.id===familyId),'unknown family');
  check(dispositions.includes(disposition),'invalid disposition');
  text(reason,'reason',600);
  check(familyId!=='unresolved-source-scope'||disposition==='unclear','unresolved family must remain unclear');
}

/** Bind model rows by stable offset only after checking the exact packet snapshot. */
export function bindFamilyChunk(packet,chunk){
  validatePacket(packet);
  check(chunk.snapshot===packet.snapshot,'chunk snapshot mismatch');
  check(Number.isSafeInteger(chunk.offset)&&chunk.offset>=0,'invalid offset');
  check(Array.isArray(chunk.rows)&&chunk.rows.length>0&&chunk.rows.length<=64&&chunk.offset+chunk.rows.length<=packet.items.length,'invalid chunk range');
  return chunk.rows.map((row,i)=>{
    check(Array.isArray(row)&&row.length===3,'invalid assignment row');
    const [familyId,disposition,reason]=row;validateAssignment(packet,familyId,disposition,reason);
    const item=packet.items[chunk.offset+i];
    return {id:item.id,bodySha256:item.bodySha256,snapshot:packet.snapshot,familyId,disposition,reason,bodyReview:'not-established-by-family-assignment'};
  });
}

export function summarizeFamilyPlan(packet,assignments){
  validatePacket(packet);check(Array.isArray(assignments),'invalid assignments');
  const byId=new Map(),items=new Map(packet.items.map(item=>[item.id,item]));
  for(const row of assignments){
    check(!byId.has(row.id),'duplicate assignment');
    check(items.has(row.id)&&items.get(row.id).bodySha256===row.bodySha256,'body binding mismatch');
    check(Object.keys(row).every(k=>['id','bodySha256','snapshot','familyId','disposition','reason','bodyReview'].includes(k)),'unexpected assignment field');
    check(row.snapshot===packet.snapshot,'assignment snapshot mismatch');
    check(row.bodyReview==='not-established-by-family-assignment','invalid body review claim');
    validateAssignment(packet,row.familyId,row.disposition,row.reason);byId.set(row.id,row);
  }
  const rows=packet.items.map(item=>({...item,...(byId.get(item.id)??{snapshot:packet.snapshot,familyId:null,disposition:'unassigned',reason:'No bound assignment',bodyReview:'not-established-by-family-assignment'})}));
  const counts=packet.families.map(f=>({familyId:f.id,total:rows.filter(r=>r.familyId===f.id).length,dispositions:Object.fromEntries(dispositions.map(d=>[d,rows.filter(r=>r.familyId===f.id&&r.disposition===d).length]))}));
  return {schema:'godskills-family-plan-v1',snapshot:packet.snapshot,authority:'none',activation:'none',summary:{total:rows.length,assigned:byId.size,remaining:rows.length-byId.size,promotions:0},families:counts,rows};
}
