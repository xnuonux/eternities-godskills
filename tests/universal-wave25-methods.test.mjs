import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {searchCatalog} from '../product/lib/product.mjs';

const product = new URL('../product/', import.meta.url);

test('Arcadia UI map inherits an exact direction contract without claiming a play verdict', async () => {
  const skill = await readFile(new URL('skills/eternities-arcadia/SKILL.md', product), 'utf8');
  const meta = JSON.parse(await readFile(new URL('skills/eternities-arcadia/skill.json', product), 'utf8'));
  const method = await readFile(new URL('skills/eternities-arcadia/references/requirement-screen-state-traceability.md', product), 'utf8');
  assert.match(skill, /requirement-to-screen\/state traceability/i);
  assert.ok(meta.resources.includes('references/requirement-screen-state-traceability.md'));
  assert.equal(meta.provenance.filter(x => x.source?.includes('game-ui-design-workflow@')).length, 3);
  assert.match(method, /parent direction contract.*ID.*revision.*digest/is);
  assert.match(method, /each approved requirement ID.*source identity.*source revision.*evidence locator or content digest/is);
  assert.match(method, /source revision or digest changes.*mark the affected requirement links/is);
  assert.match(method, /game.*build identity/is);
  assert.match(method, /human.verdict status/i);
  assert.match(method, /assumptions.*unresolved decisions/is);
  assert.match(method, /requested handoffs/i);
  assert.match(method, /structural.*not.*playtest/is);
  assert.ok(!meta.resources.some(x => /traceability-check\.mjs$/.test(x)), 'the staged optional lint is not shipped as proof');
});

test('the Arcadia UI query remains discoverable without granting activation', async () => {
  const catalog = JSON.parse(await readFile(new URL('catalog.json', product), 'utf8'));
  const skillBytes = await readFile(new URL('skills/eternities-arcadia/SKILL.md', product));
  const catalogArcadia = catalog.skills.find(x => x.id === 'eternities-arcadia');
  assert.ok(catalogArcadia.triggers.includes('map approved player-facing requirements to game screens, states, and reachable flows'));
  assert.equal(catalogArcadia.entrypointSha256, createHash('sha256').update(skillBytes).digest('hex'));
  const result = searchCatalog(catalog, 'map approved player-facing requirements to game screens states and reachable flows', {limit: 3});
  assert.ok(result.results.some(x => x.id === 'eternities-arcadia'));
  assert.equal(result.authority, 'none');
  assert.equal(result.activation, 'none');
});
