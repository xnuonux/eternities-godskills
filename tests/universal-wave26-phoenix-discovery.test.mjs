import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {searchCatalog} from '../product/lib/product.mjs';

const catalogUrl = new URL('../product/catalog.json', import.meta.url);
const skillUrl = new URL('../product/skills/eternities-phoenix/SKILL.md', import.meta.url);
const metadataUrl = new URL('../product/skills/eternities-phoenix/skill.json', import.meta.url);

const prompts = [
  'which behaviors should become evaluation cases from these support assistant conversations',
  'find failure patterns in the supplied redacted agent interaction traces and propose candidate eval cases',
];

test('supplied multi-conversation evidence discovers Phoenix case discovery without activation', async () => {
  const catalog = JSON.parse(await readFile(catalogUrl, 'utf8'));
  for (const prompt of prompts) {
    const result = searchCatalog(catalog, prompt, {limit: 5});
    assert.ok(result.results.some(item => item.id === 'eternities-phoenix'),
      `${prompt}: ${result.results.map(item => item.id).join(', ')}`);
    assert.equal(result.authority, 'none');
    assert.equal(result.activation, 'none');
  }
});

test('case discovery does not inherit diagnosis-only requirements', async () => {
  const skill = await readFile(skillUrl, 'utf8');
  const metadata = JSON.parse(await readFile(metadataUrl, 'utf8'));
  assert.match(skill, /For case discovery, follow .*trace-to-evaluation-cases\.md.* instead of the diagnosis workflow/i);
  assert.match(skill, /diagnosis and recovery working method/i);
  assert.ok(!metadata.antiTriggers.includes('no failure, degradation, or diagnostic objective'));
});
