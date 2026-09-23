import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const waveDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.resolve(waveDir, '../../..');
const expectedIds = ['r0008', 'r0037', 'r0039', 'r0040', 'r0041', 'r0063', 'r0079', 'r0083'];
const expectedPlanSha = '4e68ad4b393440c5f602e6331ae9f824a9f17672d939a347fd00d3ef8d53c6a6';
const requiredCaseKinds = new Set(['direct', 'paraphrase', 'exclusion', 'conflict', 'boundary']);
const checks = [];
const failures = [];

function digest(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function repoFile(relativePath) {
  return path.resolve(repoDir, relativePath);
}

function parseJson(relativePath) {
  return JSON.parse(readFileSync(repoFile(relativePath), 'utf8'));
}

function parseJsonl(relativePath) {
  return readFileSync(repoFile(relativePath), 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
}

function git(repositoryRoot, args) {
  return execFileSync('git', ['-C', repositoryRoot, ...args], { encoding: 'utf8' }).trim();
}

function check(name, action) {
  try {
    action();
    checks.push(name);
    process.stdout.write('PASS ' + name + '\n');
  } catch (error) {
    failures.push({ name, message: error.message });
    process.stderr.write('FAIL ' + name + ': ' + error.message + '\n');
  }
}

const integrityPath = 'artifacts/universal-product-v1/wave13-farm/source-integrity.json';
const dispositionsPath = 'artifacts/universal-product-v1/wave13-farm/source-dispositions.json';
const casesPath = 'artifacts/universal-product-v1/wave13-farm/review-cases.json';
const draftPath = 'artifacts/universal-product-v1/wave13-farm/proposed-product/skills/agricultural-observation-and-trial/references/site-data-and-water-triage.md';
const reportPath = 'artifacts/universal-product-v1/wave13-farm/author-report.md';
const receiptPath = 'artifacts/universal-product-v1/wave13-farm/author-receipt.json';
const integrity = parseJson(integrityPath);
const dispositions = parseJson(dispositionsPath);
const reviewCases = parseJson(casesPath);
const receipt = parseJson(receiptPath);

check('recorded input digests match current bounded inputs', () => {
  for (const input of integrity.inputDigests) {
    assert.equal(digest(readFileSync(repoFile(input.path))), input.sha256, input.path);
  }
  const planDigest = integrity.inputDigests.find((input) => input.path === 'data/universal-product-v1/family-plan.jsonl');
  assert.ok(planDigest);
  assert.equal(planDigest.sha256, expectedPlanSha);
});

check('fixed family plan, exact IDs, and owner mapping reconcile', () => {
  const planRows = parseJsonl('data/universal-product-v1/family-plan.jsonl');
  const selected = planRows.filter((row) => expectedIds.includes(row.id));
  assert.deepEqual(selected.map((row) => row.id), expectedIds);
  assert.ok(selected.every((row) => row.familyId === 'farm-soil-crop-planning'));
  assert.ok(selected.every((row) => row.bodyReview === 'not-established-by-family-assignment'));
  const packet = parseJson('data/universal-product-v1/family-packet.json');
  const farmFamily = packet.families.find((family) => family.id === 'farm-soil-crop-planning');
  assert.deepEqual(farmFamily.ownerIds, ['agricultural-observation-and-trial']);
  const equipmentFamily = packet.families.find((family) => family.id === 'farm-equipment-operations');
  assert.deepEqual(equipmentFamily.ownerIds, ['agricultural-observation-and-trial', 'eternities-prometheus']);
});

check('eight current warehouse bodies match pinned identity, hash, blob, and commit', () => {
  const plan = parseJsonl('data/universal-product-v1/family-plan.jsonl')
    .filter((row) => expectedIds.includes(row.id));
  const sourceManifest = parseJsonl('data/quarry-intake-2026-09-21-exa/sources.jsonl');
  assert.equal(integrity.sources.length, expectedIds.length);
  for (let index = 0; index < expectedIds.length; index += 1) {
    const record = integrity.sources[index];
    const planned = plan[index];
    assert.equal(record.id, expectedIds[index]);
    assert.equal(record.sourceId, planned.sourceId);
    assert.equal(record.declaredBodySha256, planned.bodySha256);
    const matches = sourceManifest.filter((row) => row.sourceId === record.sourceId);
    assert.equal(matches.length, 1, record.id + ' intake identity count');
    const manifest = matches[0];
    assert.equal(manifest.commit, record.pinnedCommit);
    assert.equal(manifest.path, record.repositoryRelativePath);
    assert.equal(manifest.gitBlob, record.manifestGitBlob);
    assert.equal(manifest.bodySha256, record.declaredBodySha256);
    const repositoryRoot = record.repositoryRoot.replaceAll('\\', '/');
    assert.ok(repositoryRoot.toLowerCase().startsWith('d:/03-arsenal/warehouse/'));
    const sourcePath = path.join(record.repositoryRoot, record.repositoryRelativePath);
    const bodyBytes = readFileSync(sourcePath);
    assert.equal(bodyBytes.length, record.bytes, record.id + ' byte count');
    assert.equal(digest(bodyBytes), record.currentWarehouseRawSha256, record.id + ' raw hash');
    assert.equal(record.currentWarehouseRawSha256, record.declaredBodySha256, record.id + ' declared hash');
    assert.equal(git(record.repositoryRoot, ['rev-parse', 'HEAD']), record.repositoryHeadAtReview);
    assert.equal(record.repositoryHeadAtReview, record.pinnedCommit);
    assert.equal(git(record.repositoryRoot, ['rev-parse', record.pinnedCommit + ':' + record.repositoryRelativePath]), record.pinnedCommitPathGitBlob);
    assert.equal(record.pinnedCommitPathGitBlob, record.manifestGitBlob);
    assert.equal(git(record.repositoryRoot, ['hash-object', '--no-filters', '--', record.repositoryRelativePath]), record.currentWarehouseGitBlob);
    assert.equal(record.currentWarehouseGitBlob, record.manifestGitBlob);
    assert.equal(git(record.repositoryRoot, ['status', '--porcelain', '--', record.repositoryRelativePath]), '');
    assert.equal(record.warehousePathClean, true);
    assert.equal(record.identityStatus, 'exact');
    assert.equal(record.sourceReadStatus, 'complete-entrypoint-read');
  }
});

check('prior unreviewed body states are cited without duplication', () => {
  assert.equal(dispositions.priorBodyDisposition.lookup, 'artifacts/corpus-disposition-20260922/corpus-disposition-identities.jsonl');
  assert.equal(dispositions.priorBodyDisposition.resultForAllEight.bodyReviewStatus, 'unreviewed');
  assert.equal(dispositions.priorBodyDisposition.resultForAllEight.unresolvedReason, 'no-bound-review-evidence');
  assert.equal(dispositions.sources.length, expectedIds.length);
  for (const source of dispositions.sources) {
    assert.equal(source.priorState.bodyReviewStatus, 'unreviewed', source.id);
    assert.equal(source.priorState.productDisposition, 'unresolved', source.id);
    assert.equal(source.priorState.terminalDisposition, false, source.id);
  }
});

check('all source dispositions are body-bound and owner-routed', () => {
  assert.deepEqual(dispositions.sources.map((source) => source.id), expectedIds);
  for (const source of dispositions.sources) {
    assert.equal(source.sourceReadStatus, 'complete-entrypoint-read', source.id);
    assert.equal(source.bodySha256, integrity.sources.find((item) => item.id === source.id).currentWarehouseRawSha256);
    assert.ok(source.ownerMapping);
    assert.ok(source.reason.length >= 20, source.id + ' reason');
    assert.ok(Array.isArray(source.retainedMechanisms));
    assert.ok(Array.isArray(source.rejectedMechanisms));
    assert.ok(source.license.legalClearance.length > 0);
    assert.ok(source.remainingBoundary.length > 0);
    assert.ok(['rejected', 'pattern-reference'].includes(source.bodyDisposition), source.id);
  }
  const patternSources = dispositions.sources.filter((source) => source.bodyDisposition === 'pattern-reference').map((source) => source.id);
  assert.deepEqual(patternSources, ['r0063', 'r0079', 'r0083']);
  const equipmentSource = dispositions.sources.find((source) => source.id === 'r0040');
  assert.equal(equipmentSource.ownerMapping.betterFamilyId, 'farm-equipment-operations');
  assert.deepEqual(equipmentSource.ownerMapping.betterFamilyOwnerIds, ['agricultural-observation-and-trial', 'eternities-prometheus']);
});

check('direct, paraphrase, exclusion, conflict, and boundary cases are present', () => {
  const kinds = new Set(reviewCases.cases.map((item) => item.kind));
  for (const kind of requiredCaseKinds) assert.ok(kinds.has(kind), 'missing case kind ' + kind);
  assert.equal(reviewCases.cases.length, 6);
  assert.ok(reviewCases.cases.every((item) => item.expectedBehavior.length > 0));
  assert.equal(reviewCases.status, 'authoring-cases-only; no agent runtime evaluation');
});

check('draft is portable, bounded, and clearly unadopted', () => {
  const draft = readFileSync(repoFile(draftPath), 'utf8').replace(/\s+/g, ' ');
  assert.match(draft, /Draft owner extension/);
  assert.match(draft, /not part of the product, installed pack, or active skill\s+catalog/);
  assert.match(draft, /Do not present it as a sample from the user's exact bed or field/);
  assert.match(draft, /do not interpolate or silently repair them/);
  assert.match(draft, /Do not invent a schedule threshold/);
  assert.equal(draft.includes('D:/03-ARSENAL/warehouse'), false);
  assert.equal(draft.includes('https://'), false);
});

check('receipt confines all new files and binds every deliverable digest', () => {
  const expectedChanged = [
    integrityPath,
    dispositionsPath,
    casesPath,
    draftPath,
    'artifacts/universal-product-v1/wave13-farm/validate-wave13.mjs',
    reportPath,
    receiptPath
  ].sort();
  assert.deepEqual([...receipt.changedFiles].sort(), expectedChanged);
  for (const file of receipt.changedFiles) {
    assert.ok(file.startsWith('artifacts/universal-product-v1/wave13-farm/'), file);
  }
  for (const [file, expectedDigest] of Object.entries(receipt.outputHashes)) {
    assert.ok(file.startsWith('artifacts/universal-product-v1/wave13-farm/'), file);
    assert.equal(digest(readFileSync(repoFile(file))), expectedDigest, file);
  }
  assert.ok(receipt.validation.command.includes('validate-wave13.mjs'));
  assert.equal(receipt.scope.productFilesChanged, 0);
  assert.equal(receipt.scope.externalCalls, 0);
  assert.equal(receipt.scope.sourceCodeExecuted, false);
});

if (failures.length > 0) {
  process.stderr.write('RESULT FAIL checks=' + checks.length + ' failures=' + failures.length + '\n');
  process.exitCode = 1;
} else {
  process.stdout.write('RESULT PASS checks=' + checks.length + ' sources=8 completeReads=8 dispositions=8 cases=6\n');
}
