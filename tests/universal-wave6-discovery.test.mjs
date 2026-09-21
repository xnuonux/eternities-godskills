import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {searchCatalog} from '../product/lib/product.mjs';

for(const query of [
  'Build a cash flow forecast with dated receipts payments and scenario changes',
  'A customer pays later than expected; show the effect on weekly liquidity without changing revenue',
  'Reconcile working capital settlement timing and the cash ladder across budget cases',
])test(`cash timing discovery reaches the specialist: ${query}`,async()=>{
  const catalog=JSON.parse(await readFile(new URL('../product/catalog.json',import.meta.url)));
  const found=searchCatalog(catalog,query,{limit:3});
  assert.ok(found.results.some(r=>r.id==='cashflow-forecast-scenario-integrity'),JSON.stringify(found.results.map(r=>r.id)));
  assert.equal(found.authority,'none');assert.equal(found.activation,'none');
});

test('cash forecast method links back to reconciliation without implying investment authority',async()=>{
  const catalog=JSON.parse(await readFile(new URL('../product/catalog.json',import.meta.url)));
  const item=catalog.skills.find(x=>x.id==='cashflow-forecast-scenario-integrity');
  assert.ok(item);assert.equal(item.specializes,'financial-statement-reconciliation');
  assert.ok(catalog.skills.find(x=>x.id===item.specializes).related.includes(item.id));
  const found=searchCatalog(catalog,'Choose investments to guarantee my cash flow returns',{limit:20});
  assert.ok(!found.results.some(x=>x.id===item.id));
  assert.equal(found.authority,'none');assert.equal(found.activation,'none');
});
