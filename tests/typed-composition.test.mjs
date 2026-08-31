import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  compileTypedMissionMethod,
  executeTypedMissionMethod,
  loadTypedCompositionRegistry,
  sealTypedCompositionPlan,
  verifyTypedMissionMethod,
} from "../src/typed-composition.mjs";
import {
  buildActivation,
  buildFixture,
  canaryExecutors,
  canonicalJson,
  defaultAuthority,
  logicalDigest,
  missionInputs,
  reseal,
  root,
  rootPath,
  sha256,
  unsignedPositivePlan,
} from "./helpers/typed-composition-fixture.mjs";

function expectCode(code) {
  return (error) => {
    assert.equal(error?.name, "TypedCompositionError");
    assert.equal(error?.code, code);
    return true;
  };
}

test("the canonical policy loads a closed, private-provenance metadata registry without method bodies", async () => {
  const policyPath = new URL("policies/typed-composition.v1.json", root);
  const policyBytes = await readFile(policyPath);
  const observed = [];
  const registry = await loadTypedCompositionRegistry({
    repositoryRoot: rootPath,
    policyPath: policyPath.pathname,
    expectedPolicyDigest: sha256(policyBytes),
    read: async (target) => {
      observed.push(target.replaceAll("\\", "/"));
      return readFile(target);
    },
  });

  assert.equal(registry.protocolId, "eternities-typed-composition-registry-v1");
  assert.equal(registry.capabilityLayerReceiptDigest, "1c19271951abb00e93529656a35e8fb52dccc2f3cf0b6208bcee6821361ab788");
  assert.equal(registry.activationTrustRootDigest, "c5a086bb131ff7e1a9508f02b95796ae9066627be3e8e1f8b7e57421220e9bd7");
  assert.deepEqual(registry.capabilities.map(({ capabilityId }) => capabilityId), [
    "eternities-aegis",
    "eternities-forge",
    "eternities-muse",
  ]);
  assert.match(registry.registryDigest, /^[a-f0-9]{64}$/);
  assert.ok(Object.isFrozen(registry));
  assert.ok(observed.some((target) => target.endsWith("guardrails.v1.json")));
  assert.ok(observed.every((target) => !target.endsWith("method.v1.md")));
  assert.ok(observed.every((target) => !target.endsWith("reviewer.v1.md")));
  assert.throws(() => compileTypedMissionMethod({
    registry: structuredClone(registry),
    plan: {},
    activationResult: {},
  }), expectCode("registry-integrity"));

  await assert.rejects(() => loadTypedCompositionRegistry({
    repositoryRoot: rootPath,
    policyPath: policyPath.pathname,
    expectedPolicyDigest: "0".repeat(64),
  }), expectCode("policy-integrity"));

  await assert.rejects(() => loadTypedCompositionRegistry({
    repositoryRoot: rootPath,
    policyPath: policyPath.pathname,
    expectedPolicyDigest: sha256(policyBytes),
    read: async (target) => {
      const bytes = await readFile(target);
      return target.endsWith("input.schema.json")
        ? Buffer.concat([bytes, Buffer.from(" ")])
        : bytes;
    },
  }), expectCode("registry-integrity"));
});

test("a sealed plan compiles the real Muse to Forge canary into one deterministic body-free method", async (t) => {
  const fixture = await buildFixture(t);
  const first = compileTypedMissionMethod(fixture);
  const second = compileTypedMissionMethod(fixture);

  assert.deepEqual(first, second);
  assert.equal(first.protocolId, "eternities-typed-mission-method-v1");
  assert.deepEqual(first.nodes.map(({ capabilityId }) => capabilityId), [
    "eternities-muse",
    "eternities-forge",
  ]);
  assert.deepEqual(first.nodes.map(({ phase }) => phase), ["design", "implementation"]);
  assert.deepEqual(first.nodes.map(({ activation }) => activation.mode), ["guardrail", "guardrail"]);
  assert.equal(first.aggregate.estimatedContextBytes, 8571);
  assert.equal(first.aggregate.methodBodiesEmbedded, 0);
  assert.equal(first.aggregate.sourceBodiesTransported, 0);
  assert.equal(first.aggregate.authorityExpanded, false);
  assert.doesNotMatch(JSON.stringify(first), /white-fire-sovereign|## forge loop|## muse loop/i);
  assert.deepEqual(verifyTypedMissionMethod({ registry: fixture.registry, method: first }), {
    valid: true,
    methodDigest: first.methodDigest,
    nodeCount: 2,
    linkCount: 6,
  });
});

test("the compiler binds exact activation roots, selected identities, and decision digests", async (t) => {
  const fixture = await buildFixture(t);

  assert.throws(() => compileTypedMissionMethod({
    ...fixture,
    plan: reseal(fixture.plan, (plan) => {
      plan.activationTrustRootDigest = "0".repeat(64);
    }),
  }), expectCode("trust-mismatch"));

  assert.throws(() => compileTypedMissionMethod({
    ...fixture,
    plan: reseal(fixture.plan, (plan) => {
      plan.nodes[0].activationDecisionDigest = "0".repeat(64);
    }),
  }), expectCode("activation-mismatch"));

  assert.throws(() => compileTypedMissionMethod({
    ...fixture,
    plan: reseal(fixture.plan, (plan) => {
      plan.authorityProjection.availableAuthority = ["local-read", "local-write"];
    }),
  }), expectCode("activation-mismatch"));

  const forgedActivation = structuredClone(fixture.activationResult);
  const unearned = forgedActivation.decisions[0];
  unearned.mode = "method";
  unearned.reasonCodes = ["unearned-method"];
  unearned.preInferenceDisclosure = "entrypoint-and-contract";
  unearned.deferredReview = false;
  delete unearned.decisionDigest;
  unearned.decisionDigest = logicalDigest(unearned);
  delete forgedActivation.resultDigest;
  forgedActivation.resultDigest = logicalDigest(forgedActivation);
  const forgedPlan = reseal(fixture.plan, (plan) => {
    plan.activationResultDigest = forgedActivation.resultDigest;
    plan.nodes.find(({ capabilityId }) => capabilityId === unearned.selectedId)
      .activationDecisionDigest = unearned.decisionDigest;
  });
  assert.throws(() => compileTypedMissionMethod({
    registry: fixture.registry,
    activationResult: forgedActivation,
    plan: forgedPlan,
  }), expectCode("activation-mismatch"));
});

test("unsupported, repeated, incompatible, and duplicate-phase capabilities fail closed", async (t) => {
  const fixture = await buildFixture(t);

  assert.throws(() => compileTypedMissionMethod({
    ...fixture,
    plan: reseal(fixture.plan, (plan) => {
      plan.nodes[0].capabilityId = "eternities-unknown";
    }),
  }), expectCode("capability-unsupported"));

  assert.throws(() => compileTypedMissionMethod({
    ...fixture,
    plan: reseal(fixture.plan, (plan) => {
      plan.nodes[1].capabilityId = "eternities-muse";
    }),
  }), expectCode("capability-unsupported"));

  assert.throws(() => compileTypedMissionMethod({
    ...fixture,
    plan: reseal(fixture.plan, (plan) => {
      plan.nodes[1].phase = "design";
    }),
  }), expectCode("phase-owner-conflict"));

  const activation = await buildActivation({
    capabilityIds: ["eternities-aegis", "eternities-muse", "eternities-forge"],
    trustRootDigest: fixture.registry.activationTrustRootDigest,
  });
  const incompatible = unsignedPositivePlan({
    registry: fixture.registry,
    activationResult: activation.result,
  });
  incompatible.nodes.unshift({
    nodeId: "analysis",
    phase: "analysis",
    capabilityId: "eternities-aegis",
    activationDecisionDigest: activation.result.decisions[0].decisionDigest,
  });
  assert.throws(() => compileTypedMissionMethod({
    registry: fixture.registry,
    activationResult: activation.result,
    plan: sealTypedCompositionPlan(incompatible),
  }), expectCode("compatibility-conflict"));
});

test("every required input has one exact producer and every artifact has one owner", async (t) => {
  const fixture = await buildFixture(t);

  assert.throws(() => compileTypedMissionMethod({
    ...fixture,
    plan: reseal(fixture.plan, (plan) => {
      plan.links = plan.links.filter(({ consumer }) => consumer.slotId !== "repository-state");
    }),
  }), expectCode("missing-input"));

  assert.throws(() => compileTypedMissionMethod({
    ...fixture,
    plan: reseal(fixture.plan, (plan) => {
      plan.links.push({
        artifactId: "repository-state-copy",
        producer: { kind: "mission-input", inputId: "repository-state" },
        consumer: { nodeId: "implementation", slotId: "repository-state" },
      });
    }),
  }), expectCode("duplicate-input-binding"));

  assert.throws(() => compileTypedMissionMethod({
    ...fixture,
    plan: reseal(fixture.plan, (plan) => {
      plan.links[0].artifactId = "acceptance-boundary";
    }),
  }), expectCode("duplicate-artifact-owner"));
});

test("slot identities, exact Eternities types, JSON kinds, graph direction, and cycles are enforced", async (t) => {
  const fixture = await buildFixture(t);

  assert.throws(() => compileTypedMissionMethod({
    ...fixture,
    plan: reseal(fixture.plan, (plan) => {
      plan.links[0].consumer.slotId = "invented-slot";
    }),
  }), expectCode("slot-invalid"));

  assert.throws(() => compileTypedMissionMethod({
    ...fixture,
    plan: reseal(fixture.plan, (plan) => {
      plan.missionInputs.find(({ artifactId }) => artifactId === "visual-source-set").typeId = "eternities.constraint-set";
    }),
  }), expectCode("type-mismatch"));

  assert.throws(() => compileTypedMissionMethod({
    ...fixture,
    plan: reseal(fixture.plan, (plan) => {
      plan.missionInputs.find(({ artifactId }) => artifactId === "visual-source-set").jsonKind = "object";
    }),
  }), expectCode("type-mismatch"));

  assert.throws(() => compileTypedMissionMethod({
    ...fixture,
    plan: reseal(fixture.plan, (plan) => {
      const visual = plan.links.find(({ consumer }) => consumer.slotId === "visual-source-set");
      visual.producer = { kind: "node-output", nodeId: "implementation", slotId: "implementation" };
      plan.links = plan.links.filter(({ consumer }) => consumer.slotId !== "acceptance-risk-boundary");
    }),
  }), expectCode("phase-order-conflict"));

  assert.throws(() => compileTypedMissionMethod({
    ...fixture,
    plan: reseal(fixture.plan, (plan) => {
      const visual = plan.links.find(({ consumer }) => consumer.slotId === "visual-source-set");
      visual.producer = { kind: "node-output", nodeId: "implementation", slotId: "implementation" };
    }),
  }), expectCode("cycle"));
});

test("effects, authority, preconditions, risk, context, and method bytes cannot exceed host ceilings", async (t) => {
  const conflict = await buildFixture(t, {
    mutatePolicy: (policy) => policy.effectConflicts.push(["local-read", "local-write"]),
  });
  assert.throws(() => compileTypedMissionMethod(conflict), expectCode("effect-conflict"));

  const effectAuthority = {
    ...structuredClone(defaultAuthority),
    permittedEffects: ["local-read"],
  };
  const effectOverflow = await buildFixture(t, { authorityProjection: effectAuthority });
  assert.throws(() => compileTypedMissionMethod(effectOverflow), expectCode("effect-overflow"));

  const reducedAuthority = {
    ...structuredClone(defaultAuthority),
    availableAuthority: ["local-read", "local-write"],
  };
  const authorityOverflow = await buildFixture(t, { authorityProjection: reducedAuthority });
  assert.throws(() => compileTypedMissionMethod(authorityOverflow), expectCode("authority-overflow"));

  const unknownAuthority = {
    ...structuredClone(defaultAuthority),
    availableAuthority: [...defaultAuthority.availableAuthority, "remote-root"].sort(),
  };
  const unknown = await buildFixture(t, { authorityProjection: unknownAuthority });
  assert.throws(() => compileTypedMissionMethod(unknown), expectCode("authority-overflow"));

  const noPrecondition = {
    ...structuredClone(defaultAuthority),
    availablePreconditions: ["repository-present"],
  };
  const precondition = await buildFixture(t, { authorityProjection: noPrecondition });
  assert.throws(() => compileTypedMissionMethod(precondition), expectCode("precondition-missing"));

  const lowRisk = { ...structuredClone(defaultAuthority), maximumRisk: "low" };
  const risk = await buildFixture(t, { authorityProjection: lowRisk });
  assert.throws(() => compileTypedMissionMethod(risk), expectCode("risk-overflow"));

  const context = await buildFixture(t, { maximumContextBytes: 8000 });
  assert.throws(() => compileTypedMissionMethod(context), expectCode("context-overflow"));

  const method = await buildFixture(t, {
    mutatePolicy: (policy) => {
      policy.limits.maximumCompiledMethodBytes = 1024;
    },
  });
  assert.throws(() => compileTypedMissionMethod(method), expectCode("method-overflow"));
});

test("mission outputs expose terminal artifacts rather than a value already consumed downstream", async (t) => {
  const fixture = await buildFixture(t);
  const plan = reseal(fixture.plan, (candidate) => {
    candidate.missionOutputs.push({
      outputId: "consumed-acceptance-boundary",
      nodeId: "design",
      slotId: "acceptance-boundary",
    });
  });
  assert.throws(() => compileTypedMissionMethod({ ...fixture, plan }), expectCode("plan-invalid"));
});

test("the reference runner preserves the exact Muse to Forge handoff and emits a deterministic receipt", async (t) => {
  const fixture = await buildFixture(t);
  const method = compileTypedMissionMethod(fixture);
  const observed = [];
  const { acceptanceBoundary, executors } = canaryExecutors({ observed });
  const first = await executeTypedMissionMethod({
    registry: fixture.registry,
    method,
    missionInputs,
    executors,
  });
  const second = await executeTypedMissionMethod({
    registry: fixture.registry,
    method,
    missionInputs,
    executors: canaryExecutors().executors,
  });

  assert.deepEqual(first, second);
  assert.deepEqual(observed[1].input.slots["acceptance-risk-boundary"], acceptanceBoundary);
  assert.equal(first.outputs.implementation.status, "verified");
  assert.equal(first.receipt.nodeExecutions.length, 2);
  assert.equal(first.receipt.handoffs.length, 6);
  assert.equal(first.receipt.authorityExpanded, false);
  assert.match(first.receipt.executionDigest, /^[a-f0-9]{64}$/);
});

test("the runner rejects changed methods, missing executors, malformed inputs, malformed outputs, and undeclared outputs", async (t) => {
  const fixture = await buildFixture(t);
  const method = compileTypedMissionMethod(fixture);
  const { executors } = canaryExecutors();

  const changed = structuredClone(method);
  changed.missionId = "forged";
  assert.throws(() => verifyTypedMissionMethod({ registry: fixture.registry, method: changed }), expectCode("method-integrity"));
  await assert.rejects(() => executeTypedMissionMethod({
    registry: fixture.registry,
    method: changed,
    missionInputs,
    executors,
  }), expectCode("method-integrity"));

  await assert.rejects(() => executeTypedMissionMethod({
    registry: fixture.registry,
    method,
    missionInputs,
    executors: { "eternities-muse": executors["eternities-muse"] },
  }), expectCode("executor-missing"));

  await assert.rejects(() => executeTypedMissionMethod({
    registry: fixture.registry,
    method,
    missionInputs: { ...missionInputs, "visual-source-set": { not: "an array" } },
    executors,
  }), expectCode("execution-invalid"));

  await assert.rejects(() => executeTypedMissionMethod({
    registry: fixture.registry,
    method,
    missionInputs,
    executors: {
      ...executors,
      "eternities-muse": async () => ({ broken: true }),
    },
  }), expectCode("output-invalid"));

  await assert.rejects(() => executeTypedMissionMethod({
    registry: fixture.registry,
    method,
    missionInputs,
    executors: {
      ...executors,
      "eternities-forge": async (input) => ({
        ...(await executors["eternities-forge"](input)),
        surprise: "undeclared",
      }),
    },
  }), expectCode("output-invalid"));
});

test("the composition policy remains canonical and path escapes fail before receipt reads", async (t) => {
  const policyPath = new URL("policies/typed-composition.v1.json", root);
  const policyBytes = await readFile(policyPath);
  const policy = JSON.parse(policyBytes);
  assert.equal(policyBytes.toString("utf8"), canonicalJson(policy));

  await assert.rejects(() => buildFixture(t, {
    mutatePolicy: (changed) => {
      changed.capabilityLayerReceipt.path = "../outside-receipt.json";
    },
  }), expectCode("policy-integrity"));
});
