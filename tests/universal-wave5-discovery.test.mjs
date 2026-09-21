import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {searchCatalog} from '../product/lib/product.mjs';

test('education discovery reaches reporting and substitute handoffs, not just lesson creation',async()=>{
  const catalog=JSON.parse(await readFile(new URL('../product/catalog.json',import.meta.url)));
  for(const query of ['Prepare a substitute teacher handoff for tomorrow without my usual classroom login','Draft student report comments from teacher observations and supplied achievement judgments']){
    const found=searchCatalog(catalog,query,{limit:3});
    assert.ok(found.results.some(r=>r.id==='evidence-linked-learning-design'),query);
    assert.equal(found.authority,'none');
    assert.equal(found.activation,'none');
  }
});

test('specialist exclusions leave selection with the host and owner links stay navigable',async()=>{
  const catalog=JSON.parse(await readFile(new URL('../product/catalog.json',import.meta.url)));
  for(const [id,owner,query] of [
    ['molecular-observable-integrity','physics-constrained-numerical-validation','choose a molecular force field'],
    ['portable-speech-chunk-alignment','eternities-orpheus','prove this audio callback is glitch-free'],
  ]){
    const item=catalog.skills.find(x=>x.id===id);assert.ok(item);
    assert.equal(item.specializes,owner);
    assert.ok(catalog.skills.find(x=>x.id===owner).related.includes(id));
    const found=searchCatalog(catalog,query,{limit:20});
    assert.ok(!found.results.some(x=>x.id===id));
    assert.equal(found.authority,'none');assert.equal(found.activation,'none');
  }
});

for(const [query,id] of [
  ['Check molecular dynamics trajectory observables for periodic boundary artifacts and autocorrelation','molecular-observable-integrity'],
  ['My diffusion estimate uses wrapped coordinates and treats every saved frame as independent','molecular-observable-integrity'],
  ['Prepare multilingual TTS chunks with pronunciation choices and text to audio lineage','portable-speech-chunk-alignment'],
  ['A narrated script needs grapheme safe boundaries and cancellation aware audio receipts','portable-speech-chunk-alignment'],
])test(`bounded cross-domain discovery: ${query}`,async()=>{
  const catalog=JSON.parse(await readFile(new URL('../product/catalog.json',import.meta.url)));
  const found=searchCatalog(catalog,query,{limit:3});
  assert.ok(found.results.some(r=>r.id===id),JSON.stringify(found.results.map(r=>r.id)));
  assert.equal(found.activation,'none');assert.equal(found.authority,'none');
});
