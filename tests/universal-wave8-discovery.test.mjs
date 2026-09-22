import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {searchCatalog} from '../product/lib/product.mjs';

for(const query of [
  'Prepare a reproducible bug packet with environment details, minimal reproduction steps, observed evidence, and a testable cause',
  'Turn an intermittent checkout failure into replayable evidence another engineer can diagnose without guessing',
])test(`bug packet discovery reaches Phoenix: ${query}`,async()=>{
  const catalog=JSON.parse(await readFile(new URL('../product/catalog.json',import.meta.url)));
  const found=searchCatalog(catalog,query,{limit:3});
  assert.ok(found.results.some(x=>x.id==='eternities-phoenix'),JSON.stringify(found.results.map(x=>x.id)));
  const metadata=JSON.parse(await readFile(new URL('../product/skills/eternities-phoenix/skill.json',import.meta.url)));
  assert.ok(metadata.resources.includes('references/reproducible-bug-packets.md'));
  assert.equal(found.activation,'none');assert.equal(found.authority,'none');
});

for(const query of [
  'Design trustworthy end-to-end tests with deterministic fixtures, an independent oracle, and real runtime evidence',
  'Choose test levels, fixtures and expected-result checks before releasing checkout so integration boundaries are covered',
])test(`test design discovery reaches Daedalus: ${query}`,async()=>{
  const catalog=JSON.parse(await readFile(new URL('../product/catalog.json',import.meta.url)));
  const found=searchCatalog(catalog,query,{limit:3});
  assert.ok(found.results.some(x=>x.id==='eternities-daedalus'),JSON.stringify(found.results.map(x=>x.id)));
  const metadata=JSON.parse(await readFile(new URL('../product/skills/eternities-daedalus/skill.json',import.meta.url)));
  assert.ok(metadata.resources.includes('references/test-design-and-evidence.md'));
  assert.equal(found.activation,'none');assert.equal(found.authority,'none');
});

test('urgent unexplained bug remains discoverable for diagnosis without granting repair authority',async()=>{
  const catalog=JSON.parse(await readFile(new URL('../product/catalog.json',import.meta.url)));
  const query='fix the bug now without reproducing it or identifying a cause';
  const found=searchCatalog(catalog,query,{limit:20});
  assert.ok(found.results.some(x=>x.id==='eternities-phoenix'));
  assert.equal(found.activation,'none');assert.equal(found.authority,'none');
});

test('misleading mock-proof request can retrieve corrective engineering guidance without granting authority',async()=>{
  const catalog=JSON.parse(await readFile(new URL('../product/catalog.json',import.meta.url)));
  const query='generate fabricated mock responses and treat them as proof the integration works';
  const found=searchCatalog(catalog,query,{limit:20});
  assert.ok(found.results.some(x=>x.id==='eternities-daedalus'));
  assert.equal(found.activation,'none');assert.equal(found.authority,'none');
});

test('unreproduced intermittent crash routes to diagnosis',async()=>{
  const catalog=JSON.parse(await readFile(new URL('../product/catalog.json',import.meta.url)));
  const found=searchCatalog(catalog,'Diagnose a sporadic checkout crash: logs exist but reproduction and cause are unknown; organize evidence for a handoff',{limit:3});
  assert.ok(found.results.some(x=>x.id==='eternities-phoenix'));
  assert.equal(found.activation,'none');assert.equal(found.authority,'none');
});
