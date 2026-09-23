import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { searchCatalog, verifyProduct } from '../product/lib/product.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const product = join(root, 'product');
const catalog = JSON.parse(await readFile(join(product, 'catalog.json'), 'utf8'));

const routes = [
  ['Consume an HTTP response in arbitrary byte chunks and emit only complete NDJSON records before EOF', 'eternities-hermes'],
  ['Design recovery for a partially committed payment workflow and compensate after provisioning fails', 'eternities-daedalus'],
  ['Make a source-cited board deck from supplied research and inspect every rendered slide', 'eternities-logos'],
  ['Reconcile conflicting raise figures across pitch deck, memo, and investor update', 'eternities-agora'],
];

for (const [query, owner] of routes) {
  test(`new owner refinement is discoverable for ${owner}`, () => {
    const result = searchCatalog(catalog, query, { limit: 5 });
    assert.ok(result.results.slice(0, 3).some(item => item.id === owner),
      `${owner} absent from top three: ${result.results.map(item => item.id).join(', ')}`);
    assert.equal(result.authority, 'none');
    assert.equal(result.activation, 'none');
  });
}

for (const query of [
  'A database action succeeded but a downstream service failed: decide what remains committed, what is undone, and how to reconcile before retrying',
  'A write is durable but the downstream step failed; decide whether to compensate or safely continue after checking persisted state',
  'The service should be atomic even though the first database commit must remain when the next provider call fails',
]) {
  test(`partial-commit method routes contradictory or paraphrased request: ${query}`, () => {
    const result = searchCatalog(catalog, query, { limit: 5 });
    assert.ok(result.results.slice(0, 3).some(item => item.id === 'eternities-daedalus'),
      `Daedalus absent from top three: ${result.results.map(item => item.id).join(', ')}`);
  });
}

test('partial-commit method limits atomicity to a supported transaction boundary', async () => {
  const card = await readFile(join(product, 'skills/eternities-daedalus/references/methods.md'), 'utf8');
  assert.match(card, /supported transactional boundary/i);
});

test('cross-owner handoffs appear in discovery relationships', () => {
  const logos = catalog.skills.find(item => item.id === 'eternities-logos');
  const daedalus = catalog.skills.find(item => item.id === 'eternities-daedalus');
  assert.ok(logos.related.includes('eternities-muse'));
  for (const id of ['eternities-atlas', 'release-script-safety', 'api-rate-limit-recovery'])
    assert.ok(daedalus.related.includes(id), `${id} handoff missing`);
});

const instructions = [
  ['eternities-hermes', 'references/methods.md', [/incremental decoder/i, /complete records/i, /backpressure/i, /truncated/i]],
  ['eternities-daedalus', 'references/methods.md', [/commit.*effect/i, /compensat/i, /pending.reconciliation/i, /duplicate.*retr/i]],
  ['eternities-logos', 'references/methods.md', [/claim register/i, /slide map/i, /render.*page/i, /source/i]],
  ['eternities-agora', 'references/business-decision-evidence.md', [/fact register/i, /assertion map/i, /period/i, /owner/i]],
];

for (const [owner, reference, required] of instructions) {
  test(`${owner} provides the bounded method contract`, async () => {
    const entry = await readFile(join(product, 'skills', owner, 'SKILL.md'), 'utf8');
    const card = await readFile(join(product, 'skills', owner, reference), 'utf8');
    assert.match(entry, /method|reference/i);
    for (const pattern of required) assert.match(card, pattern);
  });
}

test('the refined product remains a verified, offline package', async () => {
  const result = await verifyProduct(product);
  assert.equal(result.skillCount, 68);
  assert.equal(result.releaseId, JSON.parse(await readFile(join(product, 'release.json'), 'utf8')).releaseId);
});
