import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';

import { canonicalJson } from '../src/capability-layer-abi.mjs';
import { ADAPTER_HOST_FAMILIES, buildConformanceFixture, buildHostProjection, normalizeConformanceDecision, verifyConformanceFixture } from '../src/godskill-adapter-conformance.mjs';
import { sha256 } from '../src/io.mjs';

const digest = (label) => sha256(label);

function makeHost(hostFamily, overrides = {}) {
  return {
    hostFamily,
    hostVersion: 'fixture-1',
    modelFamily: 'fixture-model',
    reasoningTier: 'high',
    contextBudget: 240000,
    reviewAvailable: true,
    availableEffects: ['read', 'write'],
    supportsPackageProtocol: true,
    supportsProtocolVersion: 1,
    secretsOutsidePayload: true,
    ...overrides,
  };
}

function makeInput(overrides = {}) {
  return {
    protocolReceiptDigest: digest('protocol-receipt'),
    packageReceiptDigest: digest('package-receipt'),
    packageDigest: digest('package'),
    capabilityId: 'eternities-aegis',
    capabilityVersion: 4,
    missionId: 'mission-adapter-conformance',
    objectiveDigest: digest('objective'),
    requestedEffects: ['read', 'write'],
    hosts: ADAPTER_HOST_FAMILIES.map((hostFamily) => makeHost(hostFamily)),
    ...overrides,
  };
}

test('provider-neutral adapter conformance exposes its bounded host surface', () => {
  for (const exported of [
    buildConformanceFixture,
    buildHostProjection,
    normalizeConformanceDecision,
    verifyConformanceFixture,
  ]) assert.equal(typeof exported, 'function');
});

test('five host families produce one semantically equivalent normalized decision', () => {
  const input = makeInput({
    hosts: ADAPTER_HOST_FAMILIES.map((hostFamily, index) => makeHost(hostFamily, {
      hostVersion: `fixture-${index + 1}`,
      modelFamily: `fixture-model-${index + 1}`,
      contextBudget: 200000 + index * 1000,
      reviewAvailable: index !== 2,
    })),
  });
  const fixture = buildConformanceFixture(input);
  const verification = verifyConformanceFixture(fixture, {
    expectedProtocolReceiptDigest: input.protocolReceiptDigest,
    expectedPackageReceiptDigest: input.packageReceiptDigest,
  });
  assert.equal(verification.valid, true);
  assert.equal(verification.projectionCount, 5);
  assert.deepEqual(verification.hostFamilies, [...ADAPTER_HOST_FAMILIES].sort());
  assert.equal(new Set(fixture.projections.map((projection) => projection.normalizedDecisionDigest)).size, 1);
  assert.equal(fixture.semanticDecision.activationMode, 'guardrail');
  assert.equal(fixture.objectiveDigest, input.objectiveDigest);
  assert.equal(fixture.semanticDecision.objectiveDigest, input.objectiveDigest);
  assert.equal(fixture.projections[0].decision.objectiveDigest, input.objectiveDigest);
  assert.deepEqual(fixture.semanticDecision.grantedEffects, ['read', 'write']);
  assert.equal(fixture.semanticDecision.rawContentStored, false);
  assert.equal(Object.isFrozen(fixture), true);
  assert.equal(Object.isFrozen(fixture.projections[0].hostProfile), true);
  assert.throws(() => {
    fixture.projections[0].hostProfile.contextBudget = 1;
  }, TypeError);
  assert.throws(() => verifyConformanceFixture({
    ...fixture,
    projections: [...fixture.projections].reverse(),
  }), /digest|canonical host order/);
});

test('host authority is intersected and unsupported features are explicit', () => {
  const input = makeInput();
  const narrowed = buildHostProjection({
    host: makeHost('codex', { availableEffects: ['read'] }),
    mission: {
      missionId: input.missionId,
      objectiveDigest: input.objectiveDigest,
      packageReceiptDigest: input.packageReceiptDigest,
      packageDigest: input.packageDigest,
      capabilityId: input.capabilityId,
      capabilityVersion: input.capabilityVersion,
      requestedEffects: input.requestedEffects,
    },
  });
  assert.equal(narrowed.status, 'conformant');
  assert.deepEqual(narrowed.decision.grantedEffects, ['read']);
  assert.equal(narrowed.decision.grantedEffects.includes('write'), false);
  assert.ok(narrowed.reasonCodes.includes('effect-narrowed'));

  const unsupported = buildHostProjection({
    host: makeHost('codex', { supportsPackageProtocol: false, supportsProtocolVersion: 2, secretsOutsidePayload: false }),
    mission: {
      missionId: input.missionId,
      objectiveDigest: input.objectiveDigest,
      packageReceiptDigest: input.packageReceiptDigest,
      packageDigest: input.packageDigest,
      capabilityId: input.capabilityId,
      capabilityVersion: input.capabilityVersion,
      requestedEffects: input.requestedEffects,
    },
  });
  assert.equal(unsupported.status, 'unsupported');
  assert.equal(unsupported.decision, null);
  assert.equal(unsupported.normalizedDecisionDigest, null);
  assert.deepEqual(unsupported.reasonCodes, [
    'package-protocol-unsupported',
    'protocol-version-unsupported',
    'secrets-not-isolated',
  ]);
});

test('conformance rejects raw content, duplicate hosts, tampering, and unknown options', () => {
  const input = makeInput();
  assert.throws(() => buildConformanceFixture({ ...input, prompt: 'secret' }), /raw-content|closed/);
  assert.throws(() => buildHostProjection({ host: { ...input.hosts[0], notes: 'secret' }, mission: {
    missionId: input.missionId,
    objectiveDigest: input.objectiveDigest,
    packageReceiptDigest: input.packageReceiptDigest,
    packageDigest: input.packageDigest,
    capabilityId: input.capabilityId,
    capabilityVersion: input.capabilityVersion,
    requestedEffects: input.requestedEffects,
  } }), /raw-content|closed/);

  const duplicate = buildConformanceFixture({
    ...input,
    hosts: [...input.hosts.slice(0, 4), input.hosts[0]],
  });
  assert.throws(() => verifyConformanceFixture(duplicate), /duplicate|missing|canonical host order/);

  const fixture = buildConformanceFixture(input);
  assert.throws(() => verifyConformanceFixture({
    ...fixture,
    semanticDecision: { ...fixture.semanticDecision, grantedEffects: ['execute', 'read', 'write'] },
  }), /digest|widened/);
  const changedObjective = buildConformanceFixture({ ...input, objectiveDigest: digest('different objective') });
  assert.notEqual(changedObjective.digest, fixture.digest);
  assert.notEqual(changedObjective.normalizedDecisionDigest, fixture.normalizedDecisionDigest);
  assert.throws(() => verifyConformanceFixture(fixture, { prompt: 'secret' }), /raw-content|closed/);
});

test('normalization cannot consume an unsupported projection or a forged effect', () => {
  const input = makeInput();
  const mission = {
    missionId: input.missionId,
    objectiveDigest: input.objectiveDigest,
    packageReceiptDigest: input.packageReceiptDigest,
    packageDigest: input.packageDigest,
    capabilityId: input.capabilityId,
    capabilityVersion: input.capabilityVersion,
    requestedEffects: input.requestedEffects,
  };
  const unsupported = buildHostProjection({ host: makeHost('codex', { supportsProtocolVersion: 2 }), mission });
  assert.throws(() => normalizeConformanceDecision(unsupported), /unsupported projection/);
  const narrowed = buildHostProjection({ host: makeHost('codex', { availableEffects: ['read'] }), mission });
  const forged = {
    ...narrowed,
    decision: { ...narrowed.decision, grantedEffects: ['read', 'write'] },
  };
  assert.throws(() => normalizeConformanceDecision(forged), /normalized decision digest|digest/);
});

test('the conformance receipt binds the fixture, roots, contract bytes, and verification counts', async () => {
  const [receiptBytes, fixtureBytes, protocolBytes, packageBytes, schemaBytes, runtimeBytes] = await Promise.all([
    readFile(new URL('../receipts/godskill-adapter-conformance-v1.json', import.meta.url)),
    readFile(new URL('../artifacts/godskill-adapter-conformance-v1/reference.json', import.meta.url)),
    readFile(new URL('../receipts/godskill-protocol-v1.json', import.meta.url)),
    readFile(new URL('../receipts/godskill-package-v1.json', import.meta.url)),
    readFile(new URL('../schemas/godskill-adapter-conformance-v1.schema.json', import.meta.url)),
    readFile(new URL('../runtime/godskill-adapter-conformance-v1.md', import.meta.url)),
  ]);
  const receipt = JSON.parse(receiptBytes);
  const fixture = JSON.parse(fixtureBytes);
  const protocolReceipt = JSON.parse(protocolBytes);
  const packageReceipt = JSON.parse(packageBytes);
  const { receiptDigest, ...receiptBody } = receipt;
  verifyConformanceFixture(fixture, {
    expectedProtocolReceiptDigest: protocolReceipt.receiptDigest,
    expectedPackageReceiptDigest: sha256(packageBytes),
  });
  assert.equal(receipt.status, 'verified-build');
  assert.equal(receipt.conformanceId, 'eternities-godskill-adapter-conformance-v1');
  assert.equal(receipt.protocolRoot.receiptDigest, protocolReceipt.receiptDigest);
  assert.equal(receipt.protocolRoot.sha256, sha256(protocolBytes));
  assert.equal(receipt.packageRoot.packageDigest, packageReceipt.packageDigest);
  assert.equal(receipt.packageRoot.sha256, sha256(packageBytes));
  assert.equal(receipt.fixture.digest, fixture.digest);
  assert.equal(receipt.fixture.sha256, sha256(fixtureBytes));
  assert.equal(receipt.semanticDecision.normalizedDecisionDigest, fixture.normalizedDecisionDigest);
  assert.deepEqual(receipt.semanticDecision.hostFamilies, [...ADAPTER_HOST_FAMILIES].sort());
  assert.equal(receipt.semanticDecision.projectionCount, 5);
  assert.equal(receipt.schema.sha256, sha256(schemaBytes));
  assert.equal(receipt.runtime.sha256, sha256(runtimeBytes));
  assert.equal(receipt.focusedSuite.tests, 6);
  assert.equal(receipt.focusedSuite.passed, 6);
  assert.equal(receipt.fullRepositorySuite.tests, 828);
  assert.equal(receipt.fullRepositorySuite.passed, 827);
  assert.equal(receiptDigest, sha256(canonicalJson(receiptBody)));
});
