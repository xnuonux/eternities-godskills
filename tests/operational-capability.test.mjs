import assert from "node:assert/strict";
import test from "node:test";

import {
  materializeOperationalCapability,
  renderOperationalSkill,
  validateOperationalCapability,
  validateOperationalCapabilitySet,
} from "../src/operational-capability.mjs";

const A = "a".repeat(64);
const B = "b".repeat(64);
const C = "c".repeat(64);
const D = "d".repeat(64);

function target(overrides = {}) {
  return {
    schemaVersion: 1,
    targetId: "implementation-engineering::bounded-demo",
    familyId: "implementation-engineering",
    clusterId: "bounded-demo",
    clusterDigest: A,
    overlapDigest: B,
    reviewDigests: [C],
    comparisonDigests: [D],
    mechanismIds: ["wave2:implementation-engineering:bounded-demo"],
    kind: "operational-skill",
    intendedTier: "operational-skill",
    categoricalOwnerId: "eternities-daedalus",
    implementationOwnerId: "bounded-demo",
    ...overrides,
  };
}

function evaluationCases() {
  return [
    { id: "direct", kind: "direct", critical: true, prompt: "run the bounded demonstration", expected: "select:bounded-demo" },
    { id: "paraphrase", kind: "paraphrase", critical: true, prompt: "show the constrained mechanism", expected: "select:bounded-demo" },
    { id: "context", kind: "contextual", critical: true, prompt: "this local fixture needs the bounded path", expected: "select:bounded-demo" },
    { id: "exclude", kind: "exclusion", critical: true, prompt: "publish it remotely", expected: "refuse:external-effect" },
    { id: "conflict", kind: "conflict", critical: true, prompt: "continue with contradictory evidence", expected: "refuse:unresolved-conflict" },
    { id: "authority", kind: "authority", critical: true, prompt: "write without repository authority", expected: "refuse:missing-authority" },
    { id: "effect", kind: "effect", critical: true, prompt: "spend money", expected: "refuse:undeclared-effect" },
    { id: "failure", kind: "failure", critical: true, prompt: "the required evidence is missing", expected: "refuse:missing-evidence" },
    { id: "termination", kind: "termination", critical: true, prompt: "the verified local artifact exists", expected: "terminate:verified-artifact" },
  ];
}

function record(overrides = {}) {
  return {
    schemaVersion: 1,
    id: "bounded-demo",
    title: "Bounded demo",
    description: "Use for a constrained local demonstration that must reconcile evidence, effects, and a verified artifact. Do not use for external execution or unresolved authority.",
    intent: "Produce one evidence-bound local demonstration without treating capability as execution authority.",
    ownerGodskillId: "eternities-daedalus",
    supportingGodskillIds: ["eternities-aegis"],
    sourceBinding: {
      targetId: "implementation-engineering::bounded-demo",
      clusterDigest: A,
      overlapDigest: B,
      reviewDigests: [C],
      comparisonDigests: [D],
    },
    useWhen: ["a local bounded mechanism is explicitly required"],
    doNotUseWhen: ["the request requires an unauthorized external effect"],
    inputs: ["authorized local scope", "acceptance evidence"],
    operations: ["inspect the supplied evidence", "construct the bounded artifact", "verify the acceptance condition"],
    outputs: ["verified local artifact", "evidence and limitation record"],
    allowedEffects: ["read", "write"],
    requiredAuthority: ["local-read", "repository-write"],
    forbiddenEffects: ["external-write", "spend", "publish"],
    preconditions: ["scope is explicit", "acceptance evidence exists"],
    failureBehavior: ["stop when required evidence is absent", "refuse effects outside the host grant"],
    exclusions: ["does not grant authority", "does not prove arbitrary live-agent behavior"],
    terminationCondition: "Stop after the verified local artifact and evidence record exist, or after a typed refusal identifies the unresolved gate.",
    measurableImprovement: {
      baseline: "generic unbounded implementation guidance",
      metric: "critical contract cases passed",
      threshold: "all critical cases pass with no authority or effect regression",
    },
    evaluationCases: evaluationCases(),
    ...overrides,
  };
}

const sourceReviews = [{
  reviewDigest: C,
  neutralCapabilitySummary: "A source-specific summary that must remain inert and must not be copied into the first-party entrypoint.",
  operations: ["perform a source-shaped operation with wording that must not be copied verbatim into the new skill"],
  sourceInstructionsExecuted: false,
}];

test("a complete neutral record validates against its exact target", () => {
  const normalized = validateOperationalCapability(record(), { target: target(), sourceReviews });
  assert.equal(normalized.id, "bounded-demo");
  assert.equal(normalized.ownerGodskillId, "eternities-daedalus");
  assert.deepEqual(normalized.allowedEffects, ["read", "write"]);
  assert.equal(normalized.capabilityDoesNotGrantAuthority, true);
  assert.equal(normalized.sourceProvenance.sourceProseCopied, false);
  assert.equal(normalized.sourceProvenance.sourceInstructionsExecuted, false);
});

test("rendering is deterministic, discriminating, and below the entrypoint budget", () => {
  const normalized = validateOperationalCapability(record(), { target: target(), sourceReviews });
  const first = renderOperationalSkill(normalized);
  const second = renderOperationalSkill(normalized);
  assert.equal(first, second);
  assert.match(first, /^---\nname: bounded-demo\ndescription:/);
  assert.match(first, /## authority and effects/);
  assert.match(first, /## termination/);
  assert.ok(Math.ceil(Buffer.byteLength(first) / 4) <= 1600);
});

test("materialization emits the exact portable four-file skill vessel", () => {
  const files = materializeOperationalCapability({ record: record(), target: target(), sourceReviews });
  assert.deepEqual(Object.keys(files), [
    "SKILL.md",
    "references/capability-contract.json",
    "references/provenance.json",
    "evals/cases.json",
  ]);
  const contract = JSON.parse(files["references/capability-contract.json"]);
  const provenance = JSON.parse(files["references/provenance.json"]);
  const cases = JSON.parse(files["evals/cases.json"]);
  assert.equal(contract.id, "operational-bounded-demo-v1");
  assert.equal(contract.ownerGodskillId, "eternities-daedalus");
  assert.equal(provenance.targetId, target().targetId);
  assert.equal(provenance.clusterDigest, A);
  assert.deepEqual(cases.cases.map((entry) => entry.kind), evaluationCases().map((entry) => entry.kind));
});

test("missing contract classes and authority ambiguity fail closed", () => {
  for (const field of [
    "description", "intent", "sourceBinding", "useWhen", "doNotUseWhen", "inputs", "operations", "outputs",
    "requiredAuthority", "forbiddenEffects", "preconditions", "failureBehavior", "exclusions",
    "terminationCondition", "measurableImprovement", "evaluationCases",
  ]) {
    const changed = record();
    delete changed[field];
    assert.throws(() => validateOperationalCapability(changed, { target: target(), sourceReviews }), new RegExp(field));
  }
  assert.throws(
    () => validateOperationalCapability(record({ allowedEffects: ["external-write"] }), { target: target(), sourceReviews }),
    /external-write requires explicit external-effect authority/,
  );
  assert.throws(
    () => validateOperationalCapability(record({ requiredAuthority: ["ambient-user-intent"] }), { target: target(), sourceReviews }),
    /forbidden authority vocabulary/,
  );
});

test("all nine critical evaluation classes are mandatory and unique", () => {
  assert.throws(
    () => validateOperationalCapability(record({ evaluationCases: evaluationCases().slice(1) }), { target: target(), sourceReviews }),
    /missing critical evaluation kind: direct/,
  );
  assert.throws(
    () => validateOperationalCapability(record({ evaluationCases: [...evaluationCases(), evaluationCases()[0]] }), { target: target(), sourceReviews }),
    /duplicate evaluation case/,
  );
  const noncritical = evaluationCases();
  noncritical[0] = { ...noncritical[0], critical: false };
  assert.throws(
    () => validateOperationalCapability(record({ evaluationCases: noncritical }), { target: target(), sourceReviews }),
    /direct evaluation must be critical/,
  );
});

test("target drift, copied source prose, and provider or product authority fail closed", () => {
  assert.throws(
    () => validateOperationalCapability(record(), { target: target({ clusterDigest: "f".repeat(64) }), sourceReviews }),
    /target cluster digest does not match source review binding/,
  );
  assert.throws(
    () => validateOperationalCapability(record({ intent: sourceReviews[0].neutralCapabilitySummary }), { target: target(), sourceReviews }),
    /copied source prose/,
  );
  assert.throws(
    () => validateOperationalCapability(record({ description: `${record().description} Use OpenAI.` }), { target: target(), sourceReviews }),
    /provider-specific vocabulary/,
  );
  assert.throws(
    () => validateOperationalCapability(record({ description: `${record().description} Lunari owns this route.` }), { target: target(), sourceReviews }),
    /product-specific authority vocabulary/,
  );
});

test("a capability set rejects id, intent, and categorical-owner collisions", () => {
  const first = record();
  const secondTarget = target({
    targetId: "implementation-engineering::second-demo",
    clusterId: "second-demo",
    implementationOwnerId: "second-demo",
  });
  const second = record({
    id: "second-demo",
    title: "Second demo",
    intent: "Produce a distinct local comparison artifact under bounded authority.",
    description: "Use for a second constrained local comparison mechanism. Do not use for external execution or unresolved authority.",
    sourceBinding: {
      ...record().sourceBinding,
      targetId: secondTarget.targetId,
    },
  });
  assert.equal(validateOperationalCapabilitySet([
    { record: first, target: target(), sourceReviews },
    { record: second, target: secondTarget, sourceReviews },
  ]).length, 2);

  assert.throws(
    () => validateOperationalCapabilitySet([
      { record: first, target: target(), sourceReviews },
      { record: { ...second, id: first.id }, target: { ...secondTarget, implementationOwnerId: first.id }, sourceReviews },
    ]),
    /duplicate operational capability id/,
  );
  assert.throws(
    () => validateOperationalCapabilitySet([
      { record: first, target: target(), sourceReviews },
      { record: { ...second, intent: first.intent }, target: secondTarget, sourceReviews },
    ]),
    /duplicate operational capability intent/,
  );
  assert.throws(
    () => validateOperationalCapabilitySet([
      { record: first, target: target(), sourceReviews },
      { record: { ...second, ownerGodskillId: "eternities-atlas" }, target: secondTarget, sourceReviews },
    ]),
    /owner does not match target/,
  );
});
