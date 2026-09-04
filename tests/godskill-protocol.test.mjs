import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { canonicalJson } from '../src/capability-layer-abi.mjs';
import { sha256 } from '../src/io.mjs';

import {
  GODSKILL_PROTOCOL_ID,
  PROTOCOL_MESSAGE_TYPES,
  buildProtocolMessage,
  verifyProtocolMessage,
  verifyProtocolChain,
} from '../src/godskill-protocol.mjs';

const digest = (label) => sha256(label);

function makeChain() {
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
    objectiveDigest: digest('objective'),
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
    metrics: {
      tokens: 42,
      latencyMs: 12.5,
      costMinorUnits: 0,
    },
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

test('provider-neutral protocol exposes the eleven closed message types', () => {
  assert.equal(GODSKILL_PROTOCOL_ID, 'eternities-godskill-protocol-v1');
  assert.deepEqual(PROTOCOL_MESSAGE_TYPES, [
    'MissionEnvelope',
    'CapabilityQuery',
    'SelectionDecision',
    'ActivationDecision',
    'AuthorityIntersection',
    'DisclosureEnvelope',
    'ArtifactObservation',
    'ReviewObservation',
    'AcceptanceVerdict',
    'EvidenceProposal',
    'LifecycleDecision',
  ]);
  assert.equal(typeof buildProtocolMessage, 'function');
  assert.equal(typeof verifyProtocolMessage, 'function');
  assert.equal(typeof verifyProtocolChain, 'function');
});

test('builds and verifies a complete digest-bound protocol chain', () => {
  const messages = makeChain();
  const result = verifyProtocolChain(messages);
  assert.equal(result.valid, true);
  assert.equal(result.complete, true);
  assert.equal(result.messageCount, 11);
  assert.equal(result.lastMessageType, 'LifecycleDecision');
  assert.deepEqual(result.requestedEffects, ['read', 'write']);
  assert.deepEqual(result.grantedEffects, ['read', 'write']);
  assert.equal(result.authorityExpanded, false);
  assert.match(result.chainDigest, /^[a-f0-9]{64}$/);
  assert.equal(result.messageDigests.length, 11);
  for (const message of messages) {
    assert.equal(verifyProtocolMessage(message).valid, true);
  }
});

test('built protocol messages deeply freeze nested evidence metadata', () => {
  const messages = makeChain();
  assert.equal(Object.isFrozen(messages[6]), true);
  assert.equal(Object.isFrozen(messages[6].body), true);
  assert.equal(Object.isFrozen(messages[6].body.metrics), true);
  assert.throws(() => {
    messages[6].body.metrics.tokens = 99;
  }, TypeError);
  assert.equal(messages[6].body.metrics.tokens, 42);
});

test('canonical message and chain digests are stable across object key order', () => {
  const messages = makeChain();
  const original = messages[3];
  const reordered = {
    digest: original.digest,
    body: {
      authorityExpanded: original.body.authorityExpanded,
      matchedEvidenceDigest: original.body.matchedEvidenceDigest,
      packageDigest: original.body.packageDigest,
      capabilityVersion: original.body.capabilityVersion,
      explicitIntent: original.body.explicitIntent,
      mode: original.body.mode,
      disclosurePlanDigest: original.body.disclosurePlanDigest,
      capabilityId: original.body.capabilityId,
    },
    status: original.status,
    owner: original.owner,
    parentIds: [...original.parentIds],
    missionId: original.missionId,
    messageId: original.messageId,
    messageType: original.messageType,
    protocolId: original.protocolId,
    schemaVersion: original.schemaVersion,
  };
  assert.equal(canonicalJson(reordered), canonicalJson(original));
  assert.equal(verifyProtocolMessage(reordered).valid, true);
  const reorderedChain = messages.map((message, index) => index === 3 ? reordered : message);
  assert.equal(verifyProtocolChain(reorderedChain).chainDigest, verifyProtocolChain(messages).chainDigest);
});

test('partial prefixes remain verifiable without pretending to be complete', () => {
  const prefix = makeChain().slice(0, 6);
  const result = verifyProtocolChain(prefix);
  assert.equal(result.valid, true);
  assert.equal(result.complete, false);
  assert.equal(result.lastMessageType, 'DisclosureEnvelope');
  assert.deepEqual(result.grantedEffects, ['read', 'write']);
});

test('message verification rejects closed-body, digest, raw-content, and authority drift', () => {
  const message = makeChain()[0];
  const extraField = { ...message, body: { ...message.body, content: 'raw mission text' } };
  assert.throws(() => verifyProtocolMessage(extraField), /keys are not closed/);
  const providerField = { ...message, body: { ...message.body, model: 'vendor-model' } };
  assert.throws(() => verifyProtocolMessage(providerField), /keys are not closed/);
  const alteredDigest = { ...message, body: { ...message.body, targetDigest: digest('other-target') } };
  assert.throws(() => verifyProtocolMessage(alteredDigest), /digest does not match/);

  const activation = makeChain()[3];
  assert.throws(() => buildProtocolMessage({
    ...activation,
    messageType: 'ActivationDecision',
    messageId: 'activation-bad',
    parentIds: activation.parentIds,
    body: { ...activation.body, authorityExpanded: true },
  }), /cannot expand authority/);
});

test('chain verification rejects reordering, duplicate identities, wrong parents, and mission crossing', () => {
  const messages = makeChain();
  assert.throws(() => verifyProtocolChain([messages[0], messages[2], messages[1], ...messages.slice(3)]), /topologically ordered|order is not canonical/);
  assert.throws(() => verifyProtocolChain([...messages, messages[1]]), /duplicate message/);

  const wrongParent = buildProtocolMessage({
    messageType: 'ActivationDecision',
    messageId: 'activation-001',
    missionId: messages[0].missionId,
    parentIds: [messages[1].messageId],
    status: 'activated',
    body: messages[3].body,
  });
  const wrongParentChain = [...messages.slice(0, 3), wrongParent, ...messages.slice(4)];
  assert.throws(() => verifyProtocolChain(wrongParentChain), /wrong parent types/);

  const crossMission = buildProtocolMessage({
    messageType: 'ActivationDecision',
    messageId: 'activation-001',
    missionId: 'mission-002',
    parentIds: [messages[2].messageId],
    status: 'activated',
    body: messages[3].body,
  });
  const crossMissionChain = [...messages.slice(0, 3), crossMission, ...messages.slice(4)];
  assert.throws(() => verifyProtocolChain(crossMissionChain), /crosses mission identities/);
});

test('chain verification rejects effect widening, disclosure drift, review contradiction, and promotion without eligibility', () => {
  const messages = makeChain();
  const widenedAuthority = buildProtocolMessage({
    messageType: 'AuthorityIntersection',
    messageId: 'authority-001',
    missionId: messages[0].missionId,
    parentIds: [messages[3].messageId],
    status: 'allowed',
    body: {
      ...messages[4].body,
      requestedEffects: ['execute', 'read', 'write'],
      grantedEffects: ['execute', 'read', 'write'],
    },
  });
  const widenedChain = [...messages.slice(0, 4), widenedAuthority, ...messages.slice(5)];
  assert.throws(() => verifyProtocolChain(widenedChain), /widened a declared set|requested effect set|not bound|does not match/);

  const driftedDisclosure = buildProtocolMessage({
    messageType: 'DisclosureEnvelope',
    messageId: 'disclosure-001',
    missionId: messages[0].missionId,
    parentIds: [messages[3].messageId, messages[4].messageId],
    status: 'disclosed',
    body: { ...messages[5].body, mode: 'method', layer: 'method' },
  });
  const driftedChain = [...messages.slice(0, 5), driftedDisclosure, ...messages.slice(6)];
  assert.throws(() => verifyProtocolChain(driftedChain), /disclosure does not match activation/);

  const failedReview = buildProtocolMessage({
    messageType: 'ReviewObservation',
    messageId: 'review-001',
    missionId: messages[0].missionId,
    parentIds: [messages[6].messageId],
    status: 'observed',
    body: { ...messages[7].body, verdict: 'fail' },
  });
  const failedReviewChain = [...messages.slice(0, 7), failedReview, ...messages.slice(8)];
  assert.throws(() => verifyProtocolChain(failedReviewChain), /accepted verdict contradicts/);

  const deferredProposal = buildProtocolMessage({
    messageType: 'EvidenceProposal',
    messageId: 'proposal-deferred',
    missionId: messages[0].missionId,
    parentIds: [messages[8].messageId],
    status: 'deferred',
    body: { ...messages[9].body, candidateStatus: 'deferred', promotionEligible: false },
  });
  const deferredLifecycle = buildProtocolMessage({
    messageType: 'LifecycleDecision',
    messageId: 'lifecycle-invalid',
    missionId: messages[0].missionId,
    parentIds: [deferredProposal.messageId],
    status: 'recorded',
    body: { ...messages[10].body, evidenceDigest: deferredProposal.body.evidenceDigest },
  });
  const invalidPromotionChain = [
    ...messages.slice(0, 9),
    deferredProposal,
    deferredLifecycle,
  ];
  assert.throws(() => verifyProtocolChain(invalidPromotionChain), /promotion requires/);
});

test('local validators reject unsupported effects, unsorted arrays, and forbidden raw storage', () => {
  const messages = makeChain();
  assert.throws(() => buildProtocolMessage({
    messageType: 'CapabilityQuery',
    messageId: 'query-bad-effect',
    missionId: messages[0].missionId,
    parentIds: [messages[0].messageId],
    status: 'proposed',
    body: {
      queryDigest: digest('bad-query'),
      requestedEffects: ['filesystem'],
      candidateLimit: 8,
      hostKind: 'agent-neutral',
      acceptedProtocols: ['eternities-godskill-package-v1'],
    },
  }), /unsupported/);
  assert.throws(() => buildProtocolMessage({
    messageType: 'CapabilityQuery',
    messageId: 'query-unsorted',
    missionId: messages[0].missionId,
    parentIds: [messages[0].messageId],
    status: 'proposed',
    body: {
      queryDigest: digest('unsorted-query'),
      requestedEffects: ['write', 'read'],
      candidateLimit: 8,
      hostKind: 'agent-neutral',
      acceptedProtocols: ['eternities-godskill-package-v1'],
    },
  }), /canonical order/);
  assert.throws(() => buildProtocolMessage({
    messageType: 'ArtifactObservation',
    messageId: 'artifact-raw',
    missionId: messages[0].missionId,
    parentIds: [messages[5].messageId],
    status: 'observed',
    body: { ...messages[6].body, rawContentStored: true },
  }), /raw mission content/);
});

test('checked protocol receipt replays the canonical chain and binds its sources', async () => {
  const receipt = JSON.parse(await readFile(
    new URL('../receipts/godskill-protocol-v1.json', import.meta.url),
    'utf8',
  ));
  const messages = makeChain();
  const verification = verifyProtocolChain(messages);
  const chainBytes = Buffer.from(canonicalJson(messages), 'utf8');
  const schemaBytes = await readFile(new URL('../schemas/godskill-protocol-v1.schema.json', import.meta.url));
  const runtimeBytes = await readFile(new URL('../runtime/godskill-protocol-v1.md', import.meta.url));
  const { receiptDigest, ...receiptBody } = receipt;
  assert.equal(receipt.protocolId, GODSKILL_PROTOCOL_ID);
  assert.equal(receipt.chainDigest, verification.chainDigest);
  assert.deepEqual(receipt.messageDigests, verification.messageDigests);
  assert.equal(receipt.messageCount, verification.messageCount);
  assert.equal(receipt.fixture.bytes, chainBytes.length);
  assert.equal(receipt.fixture.sha256, sha256(chainBytes));
  assert.equal(receipt.schema.bytes, schemaBytes.length);
  assert.equal(receipt.schema.sha256, sha256(schemaBytes));
  assert.equal(receipt.runtime.bytes, runtimeBytes.length);
  assert.equal(receipt.runtime.sha256, sha256(runtimeBytes));
  assert.equal(receipt.focusedSuite.tests, 10);
  assert.equal(receipt.focusedSuite.failed, 0);
  assert.equal(receiptDigest, sha256(canonicalJson(receiptBody)));
});
