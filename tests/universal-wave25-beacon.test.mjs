import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {searchCatalog} from '../product/lib/product.mjs';

const product = new URL('../product/', import.meta.url);

test('Beacon sponsorship route is text-only and preserves human decision boundaries', async () => {
  const skill = await readFile(new URL('skills/eternities-beacon/SKILL.md', product), 'utf8');
  const meta = JSON.parse(await readFile(new URL('skills/eternities-beacon/skill.json', product), 'utf8'));
  const method = await readFile(new URL('skills/eternities-beacon/references/creator-sponsorship-lifecycle.md', product), 'utf8');
  assert.match(skill, /creator sponsorship lifecycle/i);
  assert.ok(meta.resources.includes('references/creator-sponsorship-lifecycle.md'));
  assert.equal(meta.triggers.at(-1), 'creator sponsorship obligation tracking with dated evidence');
  assert.equal(meta.antiTriggers.at(-1), 'infer rights, disclosure, or media-use permission from generic wildcards, incomplete evidence, or an unreviewed broad-scope summary');
  assert.equal(meta.resources.at(-1), 'references/creator-sponsorship-lifecycle.md');
  assert.match(method, /proposedAt.*agreedAt.*deliveredAt.*verifiedAt.*reportedAt/is);
  assert.match(method, /declined.*decision time.*evidence/is);
  assert.match(method, /worldwide or indefinite grant.*may be possible/is);
  assert.match(method, /human.verdict|human.owner|authorized human/is);
  assert.match(method, /not.*permission/is);
  assert.ok(!meta.resources.some(x => /validate-sponsorship-obligation\.mjs$/.test(x)), 'the failed optional validator is excluded');
  assert.equal(meta.provenance.filter(x => x.source?.includes('AgentSkills@') && /brand-pitch|campaign-proposal|campaign-recap/.test(x.source)).length, 3);
});

test('creator sponsorship discovers Beacon but does not activate an external action', async () => {
  const catalog = JSON.parse(await readFile(new URL('catalog.json', product), 'utf8'));
  const skillBytes = await readFile(new URL('skills/eternities-beacon/SKILL.md', product));
  const catalogBeacon = catalog.skills.find(x => x.id === 'eternities-beacon');
  assert.ok(catalogBeacon.triggers.includes('creator sponsorship obligation tracking with dated evidence'));
  assert.equal(catalogBeacon.entrypointSha256, createHash('sha256').update(skillBytes).digest('hex'));
  const result = searchCatalog(catalog, 'creator sponsorship obligation tracking with dated evidence', {limit: 3});
  assert.ok(result.results.some(x => x.id === 'eternities-beacon'));
  assert.equal(result.authority, 'none');
  assert.equal(result.activation, 'none');
});
