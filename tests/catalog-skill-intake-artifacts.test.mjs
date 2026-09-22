import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createClassificationRequests,buildClassifiedQueue,searchCatalogIntake} from '../src/catalog-skill-classification.mjs';
const dir=new URL('../data/quarry-intake-2026-09-21-catalog801/',import.meta.url);
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=async name=>readFile(new URL(name,dir));
const rows=bytes=>bytes.toString().trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
test('frozen catalog intake accounts every declared path and preserves exact source aliases',async()=>{
 const manifest=JSON.parse(await read('manifest.json'));
 for(const [name,evidence]of Object.entries(manifest.outputs)){const bytes=await read(name);assert.equal(sha(bytes),evidence.sha256);assert.equal(bytes.length,evidence.bytes);}
 const sources=rows(await read('sources.jsonl')),groups=rows(await read('body-groups.jsonl')),excluded=JSON.parse(await read('excluded-entries.json'));
 assert.equal(sources.length,9788);assert.equal(excluded.length,1);assert.equal(sources.length+excluded.length,9789);assert.equal(groups.length,8841);
 assert.equal(groups.reduce((n,g)=>n+g.sourceIds.length,0),sources.length);
 assert.equal(new Set(groups.flatMap(g=>g.sourceIds)).size,sources.length);
 const index=new Map(sources.map(s=>[s.sourceId,s.bodySha256]));
 for(const g of groups)for(const id of g.sourceIds)assert.equal(index.get(id),g.bodySha256);
 assert(sources.every(s=>s.activation==='none'&&s.reviewStatus==='cold-unreviewed'));
});
test('partial Jev receipts reproduce queue exactly without a network call or false completion',async()=>{
 const summary=JSON.parse(await read('classification-summary.json')),inputs=rows(await read('classification-inputs.jsonl')),groups=rows(await read('body-groups.jsonl'));
 const requests=createClassificationRequests(inputs,groups);
 assert.equal(sha(requests.map(x=>JSON.stringify(x)).join('\n')+'\n'),summary.requestPlanSha256);
 const names=(await readdir(new URL('jev-receipts/',dir))).filter(x=>x.endsWith('.json')&&!x.endsWith('.attempt.json')).sort(),receipts=[];
 for(const name of names){const bytes=await read(`jev-receipts/${name}`);assert.equal(sha(bytes),summary.receiptFiles.find(x=>x.path===`jev-receipts/${name}`).sha256);receipts.push(JSON.parse(bytes));}
 const queue=buildClassifiedQueue(inputs,groups,requests,receipts),bytes=queue.map(x=>JSON.stringify(x)).join('\n')+'\n';
 assert.equal(sha(bytes),summary.queueSha256);assert.equal(bytes,(await read('refinement-queue.jsonl')).toString());
 assert.equal(summary.classificationComplete,false);assert.equal(summary.successfulProviderBatches,9);assert.equal(summary.completedProviderReceipts,10);
 assert.equal(queue.filter(x=>x.classificationStatus==='not-dispatched').length,8758);
 assert.equal(queue.filter(x=>x.classificationStatus==='jev-unavailable').length,8);
 const matches=searchCatalogIntake(rows(await read('sources.jsonl')),queue,{query:'paper planning',limit:2});
 assert(matches.some(x=>x.repository==='EvoScientist/EvoSkills'));assert(matches.every(x=>x.activation==='none'));
});
