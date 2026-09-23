import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {searchCatalog} from '../product/lib/product.mjs';

const catalogUrl = new URL('../product/catalog.json', import.meta.url);

const visualQuestions = [
  'visualize materialized view freshness and dependent queries',
  'show connection pool saturation with a waiter queue',
  'diagram retry attempts and backoff waits on a timeline',
  'visualize consistent hash ring ownership and key migration',
  'show which nodes own keys before and after rebalancing',
];

test('operational data visualization routes to Muse without activating another skill', async () => {
  const catalog = JSON.parse(await readFile(catalogUrl, 'utf8'));
  for (const query of visualQuestions) {
    const result = searchCatalog(catalog, query, {limit: 3});
    assert.ok(result.results.some(x => x.id === 'eternities-muse'),
      `${query}: ${result.results.map(x => x.id).join(', ')}`);
    assert.equal(result.authority, 'none');
    assert.equal(result.activation, 'none');
  }
});

test('implementation and image-generation requests do not route as operational visualization', async () => {
  const catalog = JSON.parse(await readFile(catalogUrl, 'utf8'));
  for (const query of [
    'configure HTTP retries and idempotency for an API client',
    'generate an agricultural marketing image',
  ]) {
    const result = searchCatalog(catalog, query, {limit: 3});
    assert.ok(!result.results.some(x => x.id === 'eternities-muse'),
      `${query}: ${result.results.map(x => x.id).join(', ')}`);
  }
});

test('an operational visualization route exposes the data and retry owners', async () => {
  const catalog = JSON.parse(await readFile(catalogUrl, 'utf8'));
  const route = searchCatalog(catalog, 'show connection pool saturation with a waiter queue', {limit: 20});
  const muse = route.results.find(x => x.id === 'eternities-muse');
  assert.ok(muse);
  assert.ok(muse.related.includes('eternities-atlas'));
  assert.ok(muse.related.includes('eternities-hermes'));
});
