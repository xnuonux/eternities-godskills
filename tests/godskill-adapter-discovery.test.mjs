import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';

import { canonicalJson } from '../src/capability-layer-abi.mjs';
import { buildCapabilityMatrix } from '../src/godskill-adapter-sdk.mjs';
import {
  GODSKILL_ADAPTER_DISCOVERY_ID,
  discoverAdapter,
  verifyAdapterDiscovery,
} from '../src/godskill-adapter-discovery.mjs';
import { sha256 } from '../src/io.mjs';

const digest = (label) => sha256(label);

async function readMatrix() {
  const bytes = await readFile(new URL('../artifacts/godskill-adapter-sdk-v1/reference.json', import.meta.url));
  return JSON.parse(bytes);
}

function unsignedAdapter(adapter) {
  const { digest: ignoredDigest, ...body } = adapter;
  void ignoredDigest;
  return body;
}

function matrixInputFromFixture(matrix, overrides = {}) {
  return {
    matrixId: matrix.matrixId,
    protocolReceiptDigest: matrix.protocolReceiptDigest,
    packageReceiptDigest: matrix.packageReceiptDigest,
    packageDigest: matrix.packageDigest,
    capabilityId: matrix.capabilityId,
    capabilityVersion: matrix.capabilityVersion,
    missionId: matrix.missionId,
    objectiveDigest: matrix.objectiveDigest,
    requestedEffects: [...matrix.requestedEffects],
    adapters: matrix.entries.map((entry) => unsignedAdapter(entry.adapter)),
    ...overrides,
  };
}

test('provider-neutral adapter discovery exposes a closed resolver surface', () => {
  assert.equal(GODSKILL_ADAPTER_DISCOVERY_ID, 'eternities-godskill-adapter-discovery-v1');
  assert.equal(typeof discoverAdapter, 'function');
  assert.equal(typeof verifyAdapterDiscovery, 'function');
});

test('exact certified host profile selection is digest-bound and verifiable', async () => {
  const matrix = await readMatrix();
  const hostProfile = matrix.entries.find((entry) => entry.adapter.hostFamily === 'codex').adapter.hostProfile;
  const result = discoverAdapter({ matrix, hostProfile });
  const entry = matrix.entries.find((candidate) => candidate.adapter.hostFamily === 'codex');
  assert.equal(result.status, 'selected');
  assert.equal(result.discoveryId, GODSKILL_ADAPTER_DISCOVERY_ID);
  assert.equal(result.matrixDigest, matrix.digest);
  assert.equal(result.matrixStatus, 'equivalent');
  assert.equal(result.hostProfileDigest, sha256(canonicalJson(hostProfile)));
  assert.equal(result.hostFamily, 'codex');
  assert.equal(result.adapterId, entry.adapter.adapterId);
  assert.equal(result.descriptorDigest, entry.adapter.digest);
  assert.equal(result.entryDigest, entry.digest);
  assert.equal(result.projectionDigest, entry.projection.digest);
  assert.equal(result.normalizedDecisionDigest, entry.projection.normalizedDecisionDigest);
  assert.deepEqual(result.reasonCodes, ['selected-exact-profile']);
  const verification = verifyAdapterDiscovery(result, { matrix, hostProfile });
  assert.equal(verification.valid, true);
  assert.equal(verification.status, 'selected');
  assert.equal(verification.adapterId, entry.adapter.adapterId);
  assert.equal(Object.isFrozen(result), true);
});

test('host profile drift fails closed even when the family is known', async () => {
  const matrix = await readMatrix();
  const certified = matrix.entries.find((entry) => entry.adapter.hostFamily === 'codex').adapter.hostProfile;
  const drifted = { ...certified, hostVersion: 'fixture-codex-drifted' };
  const result = discoverAdapter({ matrix, hostProfile: drifted });
  assert.equal(result.status, 'unsupported');
  assert.equal(result.hostFamily, 'codex');
  assert.equal(result.adapterId, null);
  assert.equal(result.descriptorDigest, null);
  assert.equal(result.entryDigest, null);
  assert.equal(result.projectionDigest, null);
  assert.deepEqual(result.reasonCodes, ['host-profile-not-certified']);
  assert.throws(() => verifyAdapterDiscovery(result, { matrix, hostProfile: certified }), /digest|selection/);
});

test('an exact match to an unsupported matrix entry remains unsupported', async () => {
  const source = await readMatrix();
  const matrix = buildCapabilityMatrix(matrixInputFromFixture(source, {
    matrixId: 'unsupported-discovery-reference',
    adapters: source.entries.map((entry) => {
      const adapter = unsignedAdapter(entry.adapter);
      if (adapter.hostFamily !== 'codex') return adapter;
      return {
        ...adapter,
        hostProfile: { ...adapter.hostProfile, supportsProtocolVersion: 2 },
      };
    }),
  }));
  const hostProfile = matrix.entries.find((entry) => entry.adapter.hostFamily === 'codex').adapter.hostProfile;
  const result = discoverAdapter({ matrix, hostProfile });
  assert.equal(result.status, 'unsupported');
  assert.equal(result.adapterId, null);
  assert.equal(result.matrixStatus, 'mixed');
  assert.deepEqual(result.reasonCodes, ['matrix-entry-unsupported']);
  assert.equal(verifyAdapterDiscovery(result, { matrix, hostProfile }).valid, true);
});

test('discovery rejects raw content, executable values, tampering, and unknown options', async () => {
  const matrix = await readMatrix();
  const hostProfile = matrix.entries[0].adapter.hostProfile;
  assert.throws(() => discoverAdapter({
    matrix,
    hostProfile: { ...hostProfile, notes: 'secret' },
  }), /raw-content|closed/);
  assert.throws(() => discoverAdapter({
    matrix,
    hostProfile: { ...hostProfile, hostVersion: () => 'secret' },
  }), /executable|closed/);
  const result = discoverAdapter({ matrix, hostProfile });
  assert.throws(() => verifyAdapterDiscovery({ ...result, digest: digest('forged discovery') }, { matrix, hostProfile }), /digest/);
  assert.throws(() => verifyAdapterDiscovery(result, { matrix, hostProfile: { ...hostProfile, hostVersion: 'other' } }), /digest|selection/);
  assert.equal(canonicalJson(result).includes('prompt'), false);
  assert.equal(canonicalJson(result).includes('credentials'), false);
  assert.equal(canonicalJson(result).includes('function'), false);
});

test('discovery receipt fixture binds the exact result and source evidence', async () => {
  const [receiptBytes, fixtureBytes, schemaBytes, runtimeBytes] = await Promise.all([
    readFile(new URL('../receipts/godskill-adapter-discovery-v1.json', import.meta.url)),
    readFile(new URL('../artifacts/godskill-adapter-discovery-v1/reference.json', import.meta.url)),
    readFile(new URL('../schemas/godskill-adapter-discovery-v1.schema.json', import.meta.url)),
    readFile(new URL('../runtime/godskill-adapter-discovery-v1.md', import.meta.url)),
  ]);
  const receipt = JSON.parse(receiptBytes);
  const fixture = JSON.parse(fixtureBytes);
  const { receiptDigest, ...receiptBody } = receipt;
  assert.equal(receipt.status, 'verified-build');
  assert.equal(receipt.discoveryId, GODSKILL_ADAPTER_DISCOVERY_ID);
  assert.equal(receipt.fixture.digest, fixture.digest);
  assert.equal(receipt.fixture.sha256, sha256(fixtureBytes));
  assert.equal(receipt.schema.sha256, sha256(schemaBytes));
  assert.equal(receipt.runtime.sha256, sha256(runtimeBytes));
  assert.equal(receipt.result.status, fixture.status);
  assert.equal(receipt.result.adapterId, fixture.adapterId);
  assert.equal(receipt.receiptDigest, sha256(canonicalJson(receiptBody)));
  assert.match(receiptDigest, /^[a-f0-9]{64}$/);
});
