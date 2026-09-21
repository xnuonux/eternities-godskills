import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {searchCatalog} from '../product/lib/product.mjs';

for(const query of [
  'Fix canvas resize pointer coordinates and duplicate animation loops',
  'Hidden tab resumes with a huge simulation delta and pressed keys stay stuck',
])test(`browser lifecycle discovery reaches the game owner: ${query}`,async()=>{
  const catalog=JSON.parse(await readFile(new URL('../product/catalog.json',import.meta.url)));
  const found=searchCatalog(catalog,query,{limit:3});
  assert.ok(found.results.some(x=>x.id==='eternities-arcadia'),JSON.stringify(found.results.map(x=>x.id)));
  assert.equal(found.activation,'none');assert.equal(found.authority,'none');
});

for(const [id,reference,queries] of [
  ['eternities-chorus','references/stakeholder-updates.md',[
    'Write a stakeholder update with period metrics decisions owners and due dates',
    'Prepare an investor newsletter without exposing reviewer-only notes or inventing a sending receipt',
  ]],
  ['eternities-agora','references/business-decision-evidence.md',[
    'Reconcile a data room checklist with customer health signals and pipeline stage exit evidence',
    'Prepare an escalation decision packet with stale restricted documents and contradictory account signals',
  ]],
])test(`wave7 conditional reference is discoverable: ${id}`,async()=>{
  const catalog=JSON.parse(await readFile(new URL('../product/catalog.json',import.meta.url)));
  for(const query of queries){
    const found=searchCatalog(catalog,query,{limit:3});
    assert.ok(found.results.some(x=>x.id===id),`${query}: ${JSON.stringify(found.results.map(x=>x.id))}`);
    assert.equal(found.activation,'none');assert.equal(found.authority,'none');
  }
  const metadata=JSON.parse(await readFile(new URL(`../product/skills/${id}/skill.json`,import.meta.url)));
  assert.ok(metadata.resources.includes(reference));
  assert.ok((await readFile(new URL(`../product/skills/${id}/${reference}`,import.meta.url),'utf8')).length>0);
});
