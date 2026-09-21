import test from 'node:test';
import assert from 'node:assert/strict';
import { searchCatalog } from '../product/lib/product.mjs';

// Exercise the host boundary rather than grepping one user's global instructions.
test('a discovery match supplies a method locator but cannot grant host authority',()=>{
  const catalog={schema:'eternities-godskills-catalog-v1',skills:[{
    id:'release-example',category:'release',summary:'Release authorized software',
    triggers:['publish release'],antiTriggers:[],taskTypes:['build'],related:[],
    maturity:'instruction-reviewed',entrypoint:'skills/release-example/SKILL.md',entrypointSha256:'a'.repeat(64),
  }]};
  const result=searchCatalog(catalog,'publish release');
  assert.deepEqual(result.results.map(x=>x.id),['release-example']);
  assert.equal(result.activation,'none');assert.equal(result.authority,'none');
  assert.equal(result.results[0].entrypoint,'skills/release-example/SKILL.md');
  assert.equal(Object.hasOwn(result.results[0],'grants'),false);
  assert.equal(searchCatalog(catalog,'unrelated quux').results.length,0);
});
