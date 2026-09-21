import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createFamilyPacket,bindFamilyChunk,summarizeFamilyPlan} from '../src/refinement-families.mjs';
const root=new URL('../',import.meta.url),base='data/universal-product-v1/';
const read=p=>readFile(new URL(p,root));
const json=async p=>JSON.parse(await read(p));
const lines=b=>b.toString('utf8').trim().split(/\r?\n/).map(JSON.parse);
test('frozen research packet reproduces from its exact metadata baseline',async()=>{
  const packet=await json(base+'family-packet.json'),sources=lines(await read('data/quarry-intake-2026-09-21-exa/sources.jsonl')),repairs=await json(base+'metadata-description-repairs.json');
  const descriptions=Object.create(null);
  for(const row of sources)if(!Object.hasOwn(descriptions,row.bodySha256))descriptions[row.bodySha256]=row.description??'';
  for(const row of repairs.repairs)descriptions[row.bodySha256]=row.description;
  const actual=createFamilyPacket({queue:lines(await read(base+'refinement-queue.jsonl')),descriptions,families:(await json(base+'refinement-families.json')).families,skillIds:await readdir(new URL('product/skills/',root)),releaseId:packet.releaseId});
  assert.deepEqual(actual,packet);assert.equal(packet.items.length,410);assert.equal(packet.totalQueueBodies,2558);
});
test('all frozen family assignments are body-bound, accounted and reproduce the saved plan',async()=>{
  const packet=await json(base+'family-packet.json'),rows=[];
  for(const lane of ['a','b'])for(const file of (await readdir(new URL(base+`family-review-${lane}/`,root))).filter(f=>/^chunk-\d+\.json$/.test(f)).sort())rows.push(...bindFamilyChunk(packet,await json(base+`family-review-${lane}/`+file)));
  const result=summarizeFamilyPlan(packet,rows);
  assert.deepEqual(result.summary,{total:410,assigned:410,remaining:0,promotions:0});
  const plan=await read(base+'family-plan.jsonl'),saved=await json(base+'family-plan-summary.json');
  assert.deepEqual(lines(plan),result.rows);assert.deepEqual(saved.families,result.families);assert.deepEqual(saved.summary,result.summary);
  assert.equal(createHash('sha256').update(plan).digest('hex'),saved.planSha256);
  for(const file of saved.inputs)assert.equal(createHash('sha256').update(await read(file.path)).digest('hex'),file.sha256);
});
