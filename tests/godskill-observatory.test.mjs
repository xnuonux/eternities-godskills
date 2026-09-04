import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { canonicalJson } from '../src/capability-layer-abi.mjs';
import { sha256 } from '../src/io.mjs';
import {
  buildProtocolMessage,
  verifyProtocolChain,
} from '../src/godskill-protocol.mjs';
import {
  buildCounterfactualView,
  buildFailureClusterReport,
  buildObservatorySnapshot,
  extractRawSuccessCandidate,
  recordDisclosureCost,
  replayProtocolObservation,
  verifyObservatorySnapshot,
} from '../src/godskill-observatory.mjs';

const digest = (label) => sha256(label);

function makeChain(objectiveLabel = 'objective') {
  const missionId = 'mission-001';
  const packageDigest = digest('eternities-aegis-package');
  const artifactDigest = digest('artifact-001');
  const evidenceDigest = digest('evidence-001');
  const messages = [];
  const add = (messageType, messageId, status, body, parentIds = []) => {
    const message = buildProtocolMessage({
      messageType,
      messageId,
      missionId,
      parentIds,
      status,
      body,
    });
    messages.push(message);
    return message;
  };

  const mission = add('MissionEnvelope', missionId, 'open', {
    objectiveDigest: digest(objectiveLabel),
    authorityDigest: digest('mission-authority'),
    targetDigest: digest('target'),
    consequenceClass: 'high',
    contentMode: 'digest-only',
  });
  const query = add('CapabilityQuery', 'query-001', 'resolved', {
    queryDigest: digest('query'),
    requestedEffects: ['read', 'write'],
    candidateLimit: 8,
    hostKind: 'agent-neutral',
    acceptedProtocols: ['eternities-godskill-package-v1'],
  }, [mission.messageId]);
  const selection = add('SelectionDecision', 'selection-001', 'selected', {
    selectedPackageDigest: packageDigest,
    selectedCapabilityId: 'eternities-aegis',
    selectedCapabilityVersion: 4,
    selectionMode: 'single',
    reasonCodes: ['exact-capability-match'],
    selectedEffects: ['read', 'write'],
  }, [mission.messageId, query.messageId]);
  const activation = add('ActivationDecision', 'activation-001', 'activated', {
    mode: 'guardrail',
    capabilityId: 'eternities-aegis',
    capabilityVersion: 4,
    packageDigest,
    disclosurePlanDigest: digest('disclosure-plan'),
    explicitIntent: false,
    matchedEvidenceDigest: null,
    authorityExpanded: false,
  }, [selection.messageId]);
  const authority = add('AuthorityIntersection', 'authority-001', 'allowed', {
    requestedEffects: ['read', 'write'],
    grantedEffects: ['read', 'write'],
    authorityCeilingDigest: digest('authority-ceiling'),
    targetDigest: digest('target'),
    externalMutationAllowed: false,
    authorityExpanded: false,
    decision: 'allowed',
  }, [activation.messageId]);
  const disclosure = add('DisclosureEnvelope', 'disclosure-001', 'disclosed', {
    packageDigest,
    mode: 'guardrail',
    layer: 'guardrails',
    contentDigest: digest('guardrail-layer'),
    contentBytes: 1603,
    artifactRequired: false,
  }, [activation.messageId, authority.messageId]);
  const artifact = add('ArtifactObservation', 'artifact-001', 'observed', {
    artifactDigest,
    artifactKind: 'bounded-test-artifact',
    artifactBytes: 2048,
    effectObserved: 'read',
    metrics: { tokens: 42, latencyMs: 12.5, costMinorUnits: 0 },
    rawContentStored: false,
  }, [disclosure.messageId]);
  const review = add('ReviewObservation', 'review-001', 'observed', {
    reviewerId: 'terra-reviewer',
    reviewDigest: digest('review-001'),
    reviewedArtifactDigest: artifact.body.artifactDigest,
    verdict: 'pass',
    evidenceLevel: 'artifact',
    findingsDigest: digest('findings-001'),
  }, [artifact.messageId]);
  const verdict = add('AcceptanceVerdict', 'verdict-001', 'accepted', {
    artifactDigest: artifact.body.artifactDigest,
    verdict: 'accepted',
    reasonCodes: ['review-passed'],
    qualityClaim: 'artifact',
    evidenceDigest,
  }, [artifact.messageId, review.messageId]);
  const proposal = add('EvidenceProposal', 'proposal-001', 'eligible', {
    evidenceDigest,
    evidenceLevel: 'artifact',
    inputDigests: [verdict.digest],
    candidateStatus: 'eligible',
    promotionEligible: true,
  }, [verdict.messageId]);
  add('LifecycleDecision', 'lifecycle-001', 'recorded', {
    evidenceDigest,
    decision: 'promote',
    authorityDigest: digest('external-lifecycle-authority'),
    reasonCodes: ['independent-authority-approved'],
    version: 4,
  }, [proposal.messageId]);
  return messages;
}

function makeIdentity() {
  return {
    missionId: 'mission-001',
    taskDigest: digest('task'),
    capabilityDigest: digest('capability'),
    modelProfileDigest: digest('model-profile'),
    environmentDigest: digest('environment'),
  };
}

function makeCounterfactualSide(identity, variant, observationLabel, score, criticalRegressions) {
  return {
    identity,
    variant,
    observationDigest: digest(observationLabel),
    score,
    criticalRegressions,
    artifactBytes: 1200 + score,
    disclosureBytes: variant === 'raw' ? 0 : 1600,
  };
}

function makeRawObservation(label = 'raw-observation') {
  return {
    observationDigest: digest(label),
    variant: 'raw',
    verdict: 'success',
    evidenceLevel: 'model',
    missionId: 'mission-001',
    capabilityDigest: digest('capability'),
    taskDigest: digest('task'),
    modelProfileDigest: digest('model-profile'),
    environmentDigest: digest('environment'),
  };
}

test('provider-neutral observatory exposes the phase-5 data boundary', () => {
  for (const exported of [
    buildCounterfactualView,
    buildFailureClusterReport,
    buildObservatorySnapshot,
    extractRawSuccessCandidate,
    recordDisclosureCost,
    replayProtocolObservation,
    verifyObservatorySnapshot,
  ]) assert.equal(typeof exported, 'function');
});

test('replays exact protocol inputs and rejects stale changed chains', () => {
  const messages = makeChain();
  const expectedChainDigest = verifyProtocolChain(messages).chainDigest;
  const first = replayProtocolObservation({
    messages,
    expectedChainDigest,
    protocolReceiptDigest: digest('protocol-receipt'),
  });
  const second = replayProtocolObservation({
    messages: makeChain(),
    expectedChainDigest,
    protocolReceiptDigest: digest('protocol-receipt'),
  });
  assert.equal(first.recordType, 'ReplayObservation');
  assert.equal(first.digest, second.digest);
  assert.equal(first.body.complete, true);
  assert.equal(first.body.rawContentStored, false);

  const changed = makeChain('changed-objective');
  assert.notEqual(verifyProtocolChain(changed).chainDigest, expectedChainDigest);
  assert.throws(() => replayProtocolObservation({
    messages: changed,
    expectedChainDigest,
    protocolReceiptDigest: digest('protocol-receipt'),
  }), /stale protocol inputs/);
  assert.throws(() => replayProtocolObservation({
    messages,
    expectedChainDigest,
    protocolReceiptDigest: digest('protocol-receipt'),
    prompt: 'do not retain this',
  }), /raw-content|closed/);
});

test('counterfactual views preserve one identity and cannot promote', () => {
  const identity = makeIdentity();
  const view = buildCounterfactualView({
    baseline: makeCounterfactualSide(identity, 'raw', 'baseline-observation', 70, 0),
    candidate: makeCounterfactualSide(identity, 'guardrail', 'candidate-observation', 88, 1),
  });
  assert.equal(view.recordType, 'CounterfactualView');
  assert.equal(view.body.scoreDelta, 18);
  assert.equal(view.body.criticalRegressionDelta, 1);
  assert.equal(view.body.promotionEligible, false);

  const otherIdentity = { ...identity, taskDigest: digest('other-task') };
  assert.throws(() => buildCounterfactualView({
    baseline: makeCounterfactualSide(identity, 'raw', 'baseline-observation', 70, 0),
    candidate: makeCounterfactualSide(otherIdentity, 'guardrail', 'candidate-observation', 88, 1),
  }), /exact task identity/);
  assert.throws(() => buildCounterfactualView({
    baseline: makeCounterfactualSide(identity, 'raw', 'baseline-observation', 70, 0),
    candidate: { ...makeCounterfactualSide(identity, 'guardrail', 'candidate-observation', 88, 1), prompt: 'secret' },
  }), /raw-content|closed/);
});

test('raw successes produce explicitly untrusted non-promotable candidates', () => {
  const candidate = extractRawSuccessCandidate({ observation: makeRawObservation() });
  assert.equal(candidate.recordType, 'RawSuccessCandidate');
  assert.equal(candidate.body.candidateStatus, 'untrusted-candidate');
  assert.equal(candidate.body.trusted, false);
  assert.equal(candidate.body.promotionEligible, false);
  assert.throws(() => extractRawSuccessCandidate({
    observation: { ...makeRawObservation(), variant: 'method' },
  }), /requires a raw observation/);
  assert.throws(() => extractRawSuccessCandidate({
    observation: { ...makeRawObservation(), rawContent: 'secret' },
  }), /raw-content/);
});

test('failure reports are deterministic, bounded, and grouped without raw content', () => {
  const scope = digest('failure-scope');
  const observations = [
    { observationDigest: digest('failure-a'), scopeDigest: scope, failureCode: 'missing:assertion', variant: 'raw', critical: true },
    { observationDigest: digest('failure-b'), scopeDigest: scope, failureCode: 'missing:assertion', variant: 'guardrail', critical: false },
    { observationDigest: digest('failure-c'), scopeDigest: scope, failureCode: 'schema-invalid', variant: 'method', critical: true },
  ];
  const first = buildFailureClusterReport({ reportScopeDigest: scope, observations });
  const second = buildFailureClusterReport({ reportScopeDigest: scope, observations: [...observations].reverse() });
  assert.equal(first.digest, second.digest);
  assert.equal(first.body.clusterCount, 2);
  assert.equal(first.body.clusters[0].count, 2);
  assert.equal(first.body.clusters[0].criticalCount, 1);
  assert.ok(first.body.clusters.some((cluster) => cluster.failureCode === 'missing:assertion'));
  assert.throws(() => buildFailureClusterReport({
    reportScopeDigest: scope,
    observations: [{ ...observations[0], notes: 'secret' }],
  }), /raw-content/);
});

test('disclosure cost records bind exact protocol bytes and optional host metrics', () => {
  const disclosureMessage = makeChain()[5];
  const cost = recordDisclosureCost({
    disclosureMessage,
    protocolReceiptDigest: digest('protocol-receipt'),
    tokens: 120,
    latencyMs: 42.5,
    costMinorUnits: null,
  });
  assert.equal(cost.recordType, 'DisclosureCostEntry');
  assert.equal(cost.body.disclosureMessageDigest, disclosureMessage.digest);
  assert.equal(cost.body.contentBytes, 1603);
  assert.equal(cost.body.tokens, 120);
  assert.equal(cost.body.costMinorUnits, null);
  const unavailableTokens = recordDisclosureCost({
    disclosureMessage,
    protocolReceiptDigest: digest('protocol-receipt'),
    tokens: null,
    latencyMs: null,
    costMinorUnits: null,
  });
  assert.equal(unavailableTokens.body.tokens, null);
  assert.throws(() => recordDisclosureCost({
    disclosureMessage: makeChain()[4],
    protocolReceiptDigest: digest('protocol-receipt'),
    tokens: 120,
    latencyMs: null,
    costMinorUnits: null,
  }), /disclosure envelope/);
  assert.throws(() => recordDisclosureCost({
    disclosureMessage,
    protocolReceiptDigest: digest('protocol-receipt'),
    tokens: 120,
    latencyMs: null,
    costMinorUnits: null,
    rawContent: 'secret',
  }), /raw-content|closed/);
});

test('snapshots expose a digest-only read model and reject tampered retention or sources', () => {
  const messages = makeChain();
  const protocolReceiptDigest = digest('protocol-receipt');
  const replay = replayProtocolObservation({
    messages,
    expectedChainDigest: verifyProtocolChain(messages).chainDigest,
    protocolReceiptDigest,
  });
  const cost = recordDisclosureCost({
    disclosureMessage: messages[5],
    protocolReceiptDigest,
    tokens: 120,
    latencyMs: 42.5,
    costMinorUnits: null,
  });
  const failures = buildFailureClusterReport({
    reportScopeDigest: digest('failure-scope'),
    observations: [{
      observationDigest: digest('failure-a'),
      scopeDigest: digest('failure-scope'),
      failureCode: 'missing-assertion',
      variant: 'raw',
      critical: true,
    }],
  });
  const records = [replay, cost, failures];
  const snapshot = buildObservatorySnapshot({ protocolReceiptDigest, records });
  const verified = verifyObservatorySnapshot(snapshot, {
    records: [...records].reverse(),
    expectedProtocolReceiptDigest: protocolReceiptDigest,
  });
  assert.equal(verified.valid, true);
  assert.equal(verified.recordCount, 3);
  assert.equal(verified.retentionMode, 'digest-only');
  assert.equal(verified.rawContentStored, false);
  assert.deepEqual(snapshot.body.recordDigests, [...snapshot.body.recordDigests].sort());
  assert.throws(() => verifyObservatorySnapshot({
    ...snapshot,
    body: { ...snapshot.body, retentionPolicy: { ...snapshot.body.retentionPolicy, candidateAutoPromotion: true } },
  }, { records }), /digest-only|digest/);
  const swappedTypes = [...snapshot.body.recordTypes].reverse();
  const forgedUnsigned = { ...snapshot, body: { ...snapshot.body, recordTypes: swappedTypes } };
  const { digest: ignoredDigest, ...unsigned } = forgedUnsigned;
  const forged = { ...forgedUnsigned, digest: sha256(canonicalJson(unsigned)) };
  assert.throws(() => verifyObservatorySnapshot(forged, { records }), /bind/);
  assert.throws(() => buildObservatorySnapshot({
    protocolReceiptDigest,
    records: [...records, { ...replay, prompt: 'secret' }],
  }), /raw-content|closed/);
  assert.equal(canonicalJson(snapshot.body.retentionPolicy), canonicalJson({
    mode: 'digest-only',
    appendOnly: true,
    rawMissionContentStored: false,
    rawArtifactContentStored: false,
    candidateAutoPromotion: false,
  }));
});

test('snapshot verification rejects unknown option fields before inspection', () => {
  const messages = makeChain();
  const protocolReceiptDigest = digest('protocol-receipt');
  const replay = replayProtocolObservation({
    messages,
    expectedChainDigest: verifyProtocolChain(messages).chainDigest,
    protocolReceiptDigest,
  });
  const snapshot = buildObservatorySnapshot({ protocolReceiptDigest, records: [replay] });
  assert.throws(() => verifyObservatorySnapshot(snapshot, {
    records: [replay],
    prompt: 'secret',
  }), /raw-content|closed/);
});

test('checked observatory receipt replays its fixture and binds exact source files', async () => {
  const receipt = JSON.parse(await readFile(new URL('../receipts/godskill-observatory-v1.json', import.meta.url), 'utf8'));
  const fixtureBytes = await readFile(new URL('../artifacts/godskill-observatory-v1/reference.json', import.meta.url));
  const fixture = JSON.parse(fixtureBytes);
  const schemaBytes = await readFile(new URL('../schemas/godskill-observatory-v1.schema.json', import.meta.url));
  const runtimeBytes = await readFile(new URL('../runtime/godskill-observatory-v1.md', import.meta.url));
  const replayed = verifyObservatorySnapshot(fixture.snapshot, {
    records: fixture.records,
    expectedProtocolReceiptDigest: fixture.protocolReceiptDigest,
  });
  const { receiptDigest, ...receiptBody } = receipt;
  assert.equal(fixture.observatoryId, 'eternities-godskill-observatory-v1');
  assert.equal(receipt.observatoryId, fixture.observatoryId);
  assert.equal(receipt.protocolRoot.receiptDigest, fixture.protocolReceiptDigest);
  assert.equal(receipt.chain.chainDigest, fixture.chainDigest);
  assert.equal(receipt.snapshotDigest, replayed.snapshotDigest);
  assert.equal(receipt.records.count, fixture.records.length);
  assert.equal(receipt.fixture.bytes, fixtureBytes.length);
  assert.equal(receipt.fixture.sha256, sha256(fixtureBytes));
  assert.equal(receipt.schema.bytes, schemaBytes.length);
  assert.equal(receipt.schema.sha256, sha256(schemaBytes));
  assert.equal(receipt.runtime.bytes, runtimeBytes.length);
  assert.equal(receipt.runtime.sha256, sha256(runtimeBytes));
  assert.equal(receipt.focusedSuite.tests, 9);
  assert.equal(receipt.fullRepositorySuite.tests, 822);
  assert.equal(receipt.fullRepositorySuite.failed, 0);
  assert.equal(receiptDigest, sha256(canonicalJson(receiptBody)));
});
