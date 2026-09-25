import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {searchCatalog} from '../product/lib/product.mjs';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const prompts = [
  'discover the authorized connected data source for my margin audit and verify the loaded selection',
  'which connector dataset is available, and did my named analysis actually consume that exact input',
];
const naturalPrompts = [
  'What datasets can I choose from the workspace integration before looking at any rows?',
  'Was the data attached to the report actually read during its run?',
  'List the exact inputs that the named report run used.',
];
const suppliedOnlyPrompts = [
  'The attached spreadsheet is sufficient; answer from it without discovering or loading a connected source.',
  'The supplied spreadsheet answers it; analyze this file only, no remote search.',
  'Use the local CSV I attached and calculate totals only.',
];
const novelSuppliedOnlyPrompts = [
  'All required numbers are in the attached spreadsheet; do not discover or load connected data.',
  'Use only the attached workbook; no connected-source discovery or loading.',
  "The supplied CSV has everything. Don't browse available connector datasets.",
  'The report already includes the necessary data; confirm its calculations from the file without listing workspace datasets.',
  'Answer exclusively from the uploaded file; skip looking up any integrations or other datasets.',
];

test('connected-source discovery routes to Atlas without authorizing a load', async () => {
  const catalog = JSON.parse(await read('product/catalog.json'));
  for (const prompt of prompts) {
    const result = searchCatalog(catalog, prompt, {limit: 5});
    assert.ok(result.results.some(item => item.id === 'eternities-atlas'),
      `${prompt}: ${result.results.map(item => item.id).join(', ')}`);
    assert.equal(result.authority, 'none');
    assert.equal(result.activation, 'none');
  }
});

test('natural connected-source and named-run questions surface Atlas', async () => {
  const catalog = JSON.parse(await read('product/catalog.json'));
  for (const prompt of naturalPrompts) {
    const result = searchCatalog(catalog, prompt, {limit: 5});
    assert.ok(result.results.some(item => item.id === 'eternities-atlas'),
      `${prompt}: ${result.results.map(item => item.id).join(', ')}`);
    assert.equal(result.authority, 'none');
    assert.equal(result.activation, 'none');
  }
});

test('supplied-only wording remains an applicability decision, not a discovery grant', async () => {
  const catalog = JSON.parse(await read('product/catalog.json'));
  const [skill, readme] = await Promise.all([
    read('product/skills/eternities-atlas/SKILL.md'),
    read('product/README.md'),
  ]);
  for (const prompt of suppliedOnlyPrompts) {
    const result = searchCatalog(catalog, prompt, {limit: 5});
    assert.ok(!result.results.some(item => item.id === 'eternities-atlas'),
      `${prompt}: ${result.results.map(item => item.id).join(', ')}`);
    assert.equal(result.authority, 'none');
    assert.equal(result.activation, 'none');
  }
  for (const prompt of novelSuppliedOnlyPrompts) {
    const result = searchCatalog(catalog, prompt, {limit: 5});
    assert.equal(result.authority, 'none');
    assert.equal(result.activation, 'none');
  }
  assert.match(skill, /catalog match.*not.*connected.source.*route.*applies/is);
  assert.match(skill, /explicitly disallows discovery.*skip.*route/is);
  assert.match(readme, /negated discovery words.*may still shortlist.*skill/is);
  assert.match(readme, /read.*entrypoint.*before choosing.*subroute/is);
});

test('Atlas makes connected-source route conditional and distinguishes active from consumed', async () => {
  const [skill, metadata, reference] = await Promise.all([
    read('product/skills/eternities-atlas/SKILL.md'),
    read('product/skills/eternities-atlas/skill.json').then(JSON.parse),
    read('product/skills/eternities-atlas/references/connector-discovery.md'),
  ]);
  assert.match(skill, /connected.source discovery.*conditional/i);
  assert.match(skill, /references\/connector-discovery\.md/);
  assert.match(skill, /not.*default.*preflight/i);
  assert.ok(metadata.resources.includes('references/connector-discovery.md'));
  assert.ok(metadata.triggers.includes('connected source discovery'));
  assert.match(reference, /inventory.*unavailable.*unknown/is);
  assert.match(reference, /acknowledgement.*not.*active input/is);
  assert.match(reference, /active.input.*not.*consum/is);
  assert.match(reference, /row\/byte\/time\/cost bounds/i);
  assert.match(reference, /rights.*each source identity/is);
});
