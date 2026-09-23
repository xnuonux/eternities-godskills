import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const integrity = readJson('source-integrity.json');
const dispositions = readJson('source-dispositions.json');
const receipt = readJson('author-receipt.json');
const cases = readJson('check-cases.json');
const draftPath = 'proposed-product/skills/scientific-surrogate-validation/SKILL.md';
const draft = readFileSync(resolve(root, draftPath), 'utf8');
const metadata = readJson('proposed-product/skills/scientific-surrogate-validation/skill.json');
const planPath = resolve(root, '../../..', 'data/universal-product-v1/family-plan.jsonl');
const plan = readFileSync(planPath, 'utf8').trim().split(/\r?\n/).map((line) => JSON.parse(line))
  .filter((row) => ['ml-training-evaluation', 'audio-production-analysis'].includes(row.familyId));

assert.equal(integrity.familyPlanSha256, '4e68ad4b393440c5f602e6331ae9f824a9f17672d939a347fd00d3ef8d53c6a6');
assert.equal(plan.filter((row) => row.familyId === 'ml-training-evaluation').length, 14);
assert.equal(plan.filter((row) => row.familyId === 'audio-production-analysis').length, 7);
assert.equal(integrity.sources.length, 21);
assert.equal(dispositions.rows.length, 21);
assert.deepEqual(new Set(integrity.sources.map((row) => row.id)), new Set(plan.map((row) => row.id)));

for (const source of integrity.sources) {
  const planned = plan.find((row) => row.id === source.id);
  const disposition = dispositions.rows.find((row) => row.id === source.id);
  assert.equal(source.bodySha256, planned.bodySha256, `plan hash for ${source.id}`);
  assert.equal(source.actualSha256, planned.bodySha256, `current-byte hash for ${source.id}`);
  assert.equal(source.sha256Match, true, `hash match for ${source.id}`);
  assert.equal(source.gitBlobMatch, true, `Git blob for ${source.id}`);
  assert.equal(source.pinnedCommitMatch, true, `pinned commit for ${source.id}`);
  assert.ok(source.actualResolvedPath && source.actualBytes > 0, `resolved body for ${source.id}`);
  assert.ok(source.bodyReadEvidence?.kind, `read boundary for ${source.id}`);
  assert.equal(disposition.bodySha256, source.bodySha256, `disposition binding for ${source.id}`);
}

assert.equal(metadata.id, 'scientific-surrogate-validation');
assert.equal(metadata.maturity, 'draft');
assert.deepEqual(metadata.resources, []);
assert.deepEqual(metadata.related, ['experiment-artifact-lineage', 'counterbalanced-agent-evaluation', 'eternities-hephaestus']);
assert.doesNotMatch(draft, /(?:[A-Za-z]:\\|\/Users\/|\/home\/|D:\\03-ARSENAL)/i);
assert.doesNotMatch(draft, /\]\([^)]*skills\/[^)]*\)/i, 'cross-skill links are not portable');
for (const phrase of ['full candidate pool', 'failed evaluations', 'exchangeability', 'Stop without a generalization claim', 'not train a model']) {
  assert.ok(draft.toLowerCase().includes(phrase.toLowerCase()), `draft boundary: ${phrase}`);
}
assert.deepEqual(cases.cases.map((item) => item.id), ['direct', 'paraphrase', 'exclusion', 'conflict', 'boundary']);
for (const item of cases.cases) assert.ok(item.input && item.expected && item.assertions.length > 0, `case ${item.id}`);
assert.equal(receipt.status, 'ready-for-independent-review');
assert.equal(receipt.installationAuthorized, false);
assert.match(receipt.checks.result, /^PASS:/);
for (const file of receipt.candidate.files) {
  const digest = createHash('sha256').update(readFileSync(resolve(root, file.path))).digest('hex');
  assert.equal(file.sha256, digest, `candidate digest for ${file.path}`);
}
console.log('PASS: 21 exact plan leads, source bindings, draft portability, and five static contract cases.');
console.log('LIMIT: structural and authored-case checks only; no model, audio, or agent-performance evaluation.');
