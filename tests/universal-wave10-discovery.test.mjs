import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {searchCatalog} from '../product/lib/product.mjs';

const catalogUrl = new URL('../product/catalog.json', import.meta.url);
const metadataUrl = new URL('../product/skills/structured-output-contracts/skill.json', import.meta.url);

for (const query of [
  'Validate ontology annotations: class and property names, domain and range relationships, and required recommended optional completeness',
  'Check a controlled vocabulary mapping for unknown terms, relationship mismatches, missing mandatory fields, and possible corrections',
]) test(`governed vocabulary validation discovers structured-output-contracts: ${query}`, async () => {
  const catalog = JSON.parse(await readFile(catalogUrl));
  const found = searchCatalog(catalog, query, {limit: 3});
  assert.ok(found.results.some((result) => result.id === 'structured-output-contracts'), JSON.stringify(found.results.map((result) => result.id)));
  const metadata = JSON.parse(await readFile(metadataUrl));
  assert.ok(metadata.resources.includes('references/governed-vocabulary-validation.md'));
  assert.equal(found.activation, 'none');
  assert.equal(found.authority, 'none');
});

test('domain mismatch phrasing paraphrases to the same extension', async () => {
  const catalog = JSON.parse(await readFile(catalogUrl));
  const found = searchCatalog(catalog, 'Find whether a subject-predicate-object annotation uses terms outside the registry or assigns a property to the wrong subject class, then separate required omissions from advisory ones', {limit: 5});
  assert.ok(found.results.some((result) => result.id === 'structured-output-contracts'), JSON.stringify(found.results.map((result) => result.id)));
});

test('ordinary JSON shape validation remains discoverable without granting authority', async () => {
  const catalog = JSON.parse(await readFile(catalogUrl));
  const found = searchCatalog(catalog, 'Validate JSON field types and required properties against a supplied schema', {limit: 5});
  assert.ok(found.results.some((result) => result.id === 'structured-output-contracts'), JSON.stringify(found.results.map((result) => result.id)));
  assert.equal(found.activation, 'none');assert.equal(found.authority, 'none');
});

test('simple static edits and plain conversation do not require this validation workflow',async()=>{
  const catalog=JSON.parse(await readFile(catalogUrl));
  for(const query of ['edit an already supplied static JSON value','plain conversational answer about vocabulary']){
    const found=searchCatalog(catalog,query,{limit:20});
    assert(!found.results.some(result=>result.id==='structured-output-contracts'));
    assert.equal(found.activation,'none');assert.equal(found.authority,'none');
  }
});
