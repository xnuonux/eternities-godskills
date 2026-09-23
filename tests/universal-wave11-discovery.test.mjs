import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {searchCatalog} from '../product/lib/product.mjs';

const catalogUrl = new URL('../product/catalog.json', import.meta.url);

const routes = [
  {
    id: 'ecological-sampling-and-detection-uncertainty',
    resource: 'references/sampling-and-detection-records.md',
    related: ['agricultural-observation-and-trial', 'diagnostic-statistical-model-inference', 'eternities-athena', 'landscape-connectivity-analysis'],
    positive: 'audit repeated-visit ecological detection histories with non-detections and imperfect detection before occupancy claims',
    negative: 'certify species absence from one or more zero detections',
  },
  {
    id: 'landscape-connectivity-analysis',
    resource: 'references/connectivity-operations.md',
    related: ['diagnostic-statistical-model-inference', 'ecological-sampling-and-detection-uncertainty', 'eternities-athena', 'geospatial-coordinate-integrity', 'terrain-watershed-analysis'],
    positive: 'analyze habitat connectivity wildlife corridor resistance surface least-cost path sensitivity',
    negative: 'road travel-time accessibility or routing service area',
  },
  {
    id: 'terrain-watershed-analysis',
    resource: 'references/terrain-operations.md',
    related: ['eternities-athena', 'geospatial-coordinate-integrity', 'landscape-connectivity-analysis', 'physics-constrained-numerical-validation'],
    positive: 'derive slope aspect flow accumulation watershed catchment from a DEM and test stream threshold sensitivity',
    negative: 'raw LAS LAZ point-cloud classification before an elevation surface exists',
  },
];

test('the current portable catalog retains at least the 66-method wave11 milestone', async () => {
  const catalog = JSON.parse(await readFile(catalogUrl, 'utf8'));
  assert.ok(catalog.skills.length >= 66);
});

for (const route of routes) {
  test(`${route.id} has deterministic positive and negative discovery routes`, async () => {
    const catalog = JSON.parse(await readFile(catalogUrl, 'utf8'));
    const metadata = JSON.parse(await readFile(new URL(`../product/skills/${route.id}/skill.json`, import.meta.url), 'utf8'));

    assert.equal(metadata.maturity, 'instruction-reviewed');
    assert.ok(metadata.resources.includes(route.resource));
    assert.deepEqual([...metadata.related].sort(), route.related);

    const positive = searchCatalog(catalog, route.positive, {limit: 20});
    assert.ok(positive.results.some(result => result.id === route.id), JSON.stringify(positive.results.map(result => result.id)));

    const negative = searchCatalog(catalog, route.negative, {limit: 20});
    assert.ok(!negative.results.some(result => result.id === route.id), JSON.stringify(negative.results.map(result => result.id)));

    for (const found of [positive, negative]) {
      assert.equal(found.authority, 'none');
      assert.equal(found.activation, 'none');
    }
  });
}
