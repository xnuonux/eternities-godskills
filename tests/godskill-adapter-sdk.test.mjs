import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';

import { canonicalJson } from '../src/capability-layer-abi.mjs';
import {
  ADAPTER_SDK_HOST_FAMILIES,
  ADAPTER_SDK_PROTOCOL_ID,
  GODSKILL_ADAPTER_SDK_ID,
  buildAdapterDescriptor,
  buildCapabilityMatrix,
  projectAdapterMission,
  verifyCapabilityMatrix,
} from '../src/godskill-adapter-sdk.mjs';
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

function makeDescriptor(hostFamily, overrides = {}) {
  const { hostProfile: hostOverrides = {}, ...descriptorOverrides } = overrides;
  const hostProfile = makeHost(hostFamily, hostOverrides);
  return {
    schemaVersion: 1,
    sdkId: GODSKILL_ADAPTER_SDK_ID,
    adapterId: `${hostFamily}-fixture-adapter`,
    adapterVersion: 1,
    hostFamily,
    protocolId: ADAPTER_SDK_PROTOCOL_ID,
    protocolVersion: 1,
    supportedEffects: ['execute', 'external-write', 'network', 'read', 'write'],
    supportedReasoningTiers: ['high', 'low', 'max', 'medium', 'minimal', 'none', 'ultra', 'xhigh'],
    maxContextBudget: 400000,
    reviewModes: hostProfile.reviewAvailable ? ['review'] : [],
    hostProfile,
    ...descriptorOverrides,
  };
}

function makeMission(overrides = {}) {
  return {
    missionId: 'mission-adapter-sdk-reference',
    objectiveDigest: digest('adapter-sdk-objective'),
    packageReceiptDigest: digest('adapter-sdk-package-receipt'),
    packageDigest: digest('adapter-sdk-package'),
    capabilityId: 'eternities-aegis',
    capabilityVersion: 4,
    requestedEffects: ['read', 'write'],
    ...overrides,
  };
}

function makeMatrixInput(overrides = {}) {
  return {
    matrixId: 'provider-neutral-adapter-sdk-reference',
    protocolReceiptDigest: digest('adapter-sdk-protocol-receipt'),
    packageReceiptDigest: digest('adapter-sdk-package-receipt'),
    packageDigest: digest('adapter-sdk-package'),
    capabilityId: 'eternities-aegis',
    capabilityVersion: 4,
    missionId: 'mission-adapter-sdk-reference',
    objectiveDigest: digest('adapter-sdk-objective'),
    requestedEffects: ['read', 'write'],
    adapters: ADAPTER_SDK_HOST_FAMILIES.map((hostFamily) => makeDescriptor(hostFamily)),
    ...overrides,
  };
}

test('provider-neutral adapter sdk exposes a closed opt-in surface', () => {
  assert.equal(GODSKILL_ADAPTER_SDK_ID, 'eternities-godskill-adapter-sdk-v1');
  assert.equal(ADAPTER_SDK_PROTOCOL_ID, 'eternities-godskill-protocol-v1');
  assert.deepEqual([...ADAPTER_SDK_HOST_FAMILIES], [
    'claude-code',
    'codex',
    'godagents',
    'local-model',
    'mcp',
  ]);
  for (const exported of [
    buildAdapterDescriptor,
    projectAdapterMission,
    buildCapabilityMatrix,
    verifyCapabilityMatrix,
  ]) assert.equal(typeof exported, 'function');
});

test('adapter descriptors are deterministic, bounded, and deeply immutable', () => {
  const first = buildAdapterDescriptor(makeDescriptor('codex'));
  const second = buildAdapterDescriptor(makeDescriptor('codex'));
  assert.deepEqual(first, second);
  assert.match(first.digest, /^[a-f0-9]{64}$/);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.hostProfile), true);
  assert.equal(Object.isFrozen(first.supportedEffects), true);
  assert.throws(() => {
    first.hostProfile.contextBudget = 1;
  }, TypeError);
  assert.throws(() => buildAdapterDescriptor({ ...makeDescriptor('codex'), notes: 'secret' }), /raw-content|closed/);
  assert.throws(() => buildAdapterDescriptor({
    ...makeDescriptor('codex'),
    supportedEffects: ['read'],
  }), /ceiling/);
  assert.throws(() => buildAdapterDescriptor({
    ...makeDescriptor('codex'),
    maxContextBudget: 100,
  }), /context ceiling/);
  assert.throws(() => buildAdapterDescriptor({
    ...makeDescriptor('codex'),
    supportedReasoningTiers: ['low'],
  }), /reasoning tier/);
  assert.throws(() => buildAdapterDescriptor({
    ...makeDescriptor('codex'),
    reviewModes: [],
  }), /review/);
  const changed = buildAdapterDescriptor(makeDescriptor('codex', {
    hostProfile: { modelFamily: 'different-fixture-model' },
  }));
  assert.notEqual(changed.digest, first.digest);
});

test('adapter projection binds descriptor identity and preserves conformance limits', () => {
  const adapter = buildAdapterDescriptor(makeDescriptor('codex', {
    hostProfile: { availableEffects: ['read'] },
  }));
  const projection = projectAdapterMission({ adapter, mission: makeMission() });
  assert.equal(projection.sdkId, GODSKILL_ADAPTER_SDK_ID);
  assert.equal(projection.adapterId, adapter.adapterId);
  assert.equal(projection.descriptorDigest, adapter.digest);
  assert.equal(projection.projection.hostFamily, 'codex');
  assert.equal(projection.projection.status, 'conformant');
  assert.deepEqual(projection.projection.decision.grantedEffects, ['read']);
  assert.equal(projection.projection.decision.objectiveDigest, digest('adapter-sdk-objective'));
  assert.ok(projection.projection.reasonCodes.includes('effect-narrowed'));
  assert.match(projection.digest, /^[a-f0-9]{64}$/);
  assert.equal(Object.isFrozen(projection), true);
  assert.equal(Object.isFrozen(projection.projection), true);
  assert.throws(() => projectAdapterMission({
    adapter,
    mission: { ...makeMission(), prompt: 'do not carry raw content' },
  }), /raw-content|closed/);
});

test('unsupported host preconditions remain explicit and carry no decision', () => {
  const adapter = buildAdapterDescriptor(makeDescriptor('codex', {
    hostProfile: {
      supportsPackageProtocol: false,
      supportsProtocolVersion: 2,
      secretsOutsidePayload: false,
    },
  }));
  const projection = projectAdapterMission({ adapter, mission: makeMission() });
  assert.equal(projection.projection.status, 'unsupported');
  assert.equal(projection.projection.decision, null);
  assert.equal(projection.projection.normalizedDecisionDigest, null);
  assert.deepEqual(projection.projection.reasonCodes, [
    'package-protocol-unsupported',
    'protocol-version-unsupported',
    'secrets-not-isolated',
  ]);
});

test('equivalent five-family matrix has one semantic decision and exact root binding', () => {
  const input = makeMatrixInput();
  const matrix = buildCapabilityMatrix(input);
  const verification = verifyCapabilityMatrix(matrix, {
    expectedProtocolReceiptDigest: input.protocolReceiptDigest,
    expectedPackageReceiptDigest: input.packageReceiptDigest,
  });
  assert.equal(verification.valid, true);
  assert.equal(verification.status, 'equivalent');
  assert.equal(verification.entryCount, 5);
  assert.deepEqual(verification.hostFamilies, [...ADAPTER_SDK_HOST_FAMILIES].sort());
  assert.equal(matrix.semanticDecision.objectiveDigest, input.objectiveDigest);
  assert.equal(matrix.semanticDecision.rawContentStored, false);
  assert.equal(new Set(matrix.entries.map((entry) => entry.projection.normalizedDecisionDigest)).size, 1);
  assert.equal(Object.isFrozen(matrix), true);
  assert.equal(Object.isFrozen(matrix.entries[0].adapter), true);
  assert.equal(Object.isFrozen(matrix.entries[0].projection), true);
});

test('matrix distinguishes mixed and wholly unsupported host sets', () => {
  const base = makeMatrixInput();
  const mixed = buildCapabilityMatrix({
    ...base,
    matrixId: 'mixed-adapter-sdk-reference',
    adapters: [
      makeDescriptor('claude-code', { hostProfile: { availableEffects: ['read'] } }),
      makeDescriptor('codex'),
    ],
  });
  assert.equal(mixed.status, 'mixed');
  assert.equal(mixed.semanticDecision, null);
  assert.equal(mixed.normalizedDecisionDigest, null);
  assert.equal(new Set(mixed.entries.map((entry) => entry.projection.normalizedDecisionDigest)).size, 2);

  const unsupported = buildCapabilityMatrix({
    ...base,
    matrixId: 'unsupported-adapter-sdk-reference',
    adapters: [
      makeDescriptor('claude-code', { hostProfile: { supportsProtocolVersion: 2 } }),
      makeDescriptor('codex', { hostProfile: { supportsPackageProtocol: false } }),
    ],
  });
  assert.equal(unsupported.status, 'unsupported');
  assert.equal(unsupported.semanticDecision, null);
  assert.equal(unsupported.entries.every((entry) => entry.projection.status === 'unsupported'), true);
});

test('matrix input is closed, canonical, unique, and digest-bound', () => {
  const input = makeMatrixInput();
  assert.throws(() => buildCapabilityMatrix({ ...input, prompt: 'secret' }), /raw-content|closed/);
  assert.throws(() => buildCapabilityMatrix({
    ...input,
    adapters: [...input.adapters].reverse(),
  }), /canonical adapter order/);
  assert.throws(() => buildCapabilityMatrix({
    ...input,
    adapters: [...input.adapters.slice(0, 4), input.adapters[0]],
  }), /duplicate|host family/);
  assert.throws(() => verifyCapabilityMatrix(buildCapabilityMatrix(input), { unknown: true }), /closed/);

  const matrix = buildCapabilityMatrix(input);
  const changedObjective = buildCapabilityMatrix({ ...input, objectiveDigest: digest('changed adapter-sdk objective') });
  assert.notEqual(changedObjective.digest, matrix.digest);
  assert.notEqual(changedObjective.normalizedDecisionDigest, matrix.normalizedDecisionDigest);
  assert.throws(() => verifyCapabilityMatrix({
    ...matrix,
    digest: digest('forged matrix'),
  }), /digest/);
  assert.throws(() => verifyCapabilityMatrix({
    ...matrix,
    entries: matrix.entries.map((entry, index) => index === 0
      ? { ...entry, descriptorDigest: digest('forged descriptor') }
      : entry),
  }), /digest|descriptor/);
  assert.throws(() => buildCapabilityMatrix({
    ...input,
    adapters: input.adapters.map((adapter, index) => index === 0
      ? { ...adapter, hostProfile: { ...adapter.hostProfile, execute: () => 'secret' } }
      : adapter),
  }), /closed|raw-content|executable/);
  assert.equal(canonicalJson(matrix).includes('prompt'), false);
});

test('adapter matrix does not store raw content or executable values', () => {
  const input = makeMatrixInput();
  const matrix = buildCapabilityMatrix(input);
  const serialized = canonicalJson(matrix);
  assert.equal(serialized.includes('credentials'), false);
  assert.equal(serialized.includes('"rawContent":'), false);
  assert.equal(serialized.includes('"rawPrompt"'), false);
  assert.equal(serialized.includes('"prompt"'), false);
  assert.equal(serialized.includes('function'), false);
  assert.equal(matrix.entries.every((entry) => entry.projection.projection?.rawContentStored !== true), true);
});

test('sdk receipt fixture binds the matrix, schema, and runtime evidence', async () => {
  const [receiptBytes, fixtureBytes, schemaBytes, runtimeBytes] = await Promise.all([
    readFile(new URL('../receipts/godskill-adapter-sdk-v1.json', import.meta.url)),
    readFile(new URL('../artifacts/godskill-adapter-sdk-v1/reference.json', import.meta.url)),
    readFile(new URL('../schemas/godskill-adapter-sdk-v1.schema.json', import.meta.url)),
    readFile(new URL('../runtime/godskill-adapter-sdk-v1.md', import.meta.url)),
  ]);
  const receipt = JSON.parse(receiptBytes);
  const fixture = JSON.parse(fixtureBytes);
  const { receiptDigest, ...receiptBody } = receipt;
  assert.equal(receipt.status, 'verified-build');
  assert.equal(receipt.sdkId, GODSKILL_ADAPTER_SDK_ID);
  assert.equal(receipt.fixture.digest, fixture.digest);
  assert.equal(receipt.fixture.sha256, sha256(fixtureBytes));
  assert.equal(receipt.schema.sha256, sha256(schemaBytes));
  assert.equal(receipt.runtime.sha256, sha256(runtimeBytes));
  assert.equal(receipt.matrix.status, fixture.status);
  assert.equal(receipt.matrix.entryCount, fixture.entries.length);
  assert.equal(receipt.receiptDigest, sha256(canonicalJson(receiptBody)));
  assert.match(receiptDigest, /^[a-f0-9]{64}$/);
});
