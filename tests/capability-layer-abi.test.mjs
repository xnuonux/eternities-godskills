import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function json(relative) {
  return JSON.parse(await readFile(new URL(relative, root), "utf8"));
}

async function loadCanaryInput(capabilityId) {
  const policyPath = "policies/capability-layer-abi.v1.json";
  const policyBytes = await readFile(new URL(policyPath, root));
  const policy = JSON.parse(policyBytes);
  const canary = policy.canaries.find((candidate) => candidate.capabilityId === capabilityId);
  assert.ok(canary, `missing canary policy: ${capabilityId}`);
  const sources = Object.fromEntries(await Promise.all(
    Object.entries(canary.sources).map(async ([name, relative]) => [
      name,
      { path: relative, bytes: await readFile(new URL(relative, root)) },
    ]),
  ));
  return {
    policy,
    policySource: { path: policyPath, bytes: policyBytes },
    canary,
    sources,
  };
}

function cloneCanaryInput(input) {
  return {
    policy: structuredClone(input.policy),
    policySource: {
      path: input.policySource.path,
      bytes: Buffer.from(input.policySource.bytes),
    },
    canary: structuredClone(input.canary),
    sources: Object.fromEntries(Object.entries(input.sources).map(([name, source]) => [
      name,
      { path: source.path, bytes: Buffer.from(source.bytes) },
    ])),
  };
}

test("capability layer policy freezes three sorted first-party canaries", async () => {
  const policy = await json("policies/capability-layer-abi.v1.json");

  assert.equal(policy.schemaVersion, 1);
  assert.equal(policy.id, "capability-layer-abi-v1");
  assert.deepEqual(policy.canaries.map(({ capabilityId }) => capabilityId), [
    "eternities-aegis",
    "eternities-forge",
    "eternities-muse",
  ]);
  assert.equal(policy.reviewerPolicy.artifactRequired, true);
  assert.equal(policy.reviewerPolicy.selfCertificationAllowed, false);
  assert.equal(policy.verifierPolicy.initialStatus, "declared-not-executed");
  assert.equal(policy.capabilityGrantsAuthority, false);
});

test("every canary slot maps to an exact capability source field", async () => {
  const policy = await json("policies/capability-layer-abi.v1.json");

  for (const canary of policy.canaries) {
    const contract = await json(canary.sources.contract);
    const route = await json(canary.sources.routingCard);
    assert.equal(contract.name, canary.capabilityId);
    assert.equal(route.id, canary.capabilityId);

    for (const [slots, source] of [
      [canary.inputSlots, contract.inputs],
      [canary.outputSlots, contract.outputs],
    ]) {
      assert.equal(new Set(slots.map(({ id }) => id)).size, slots.length);
      assert.equal(new Set(slots.map(({ typeId }) => typeId)).size, slots.length);
      for (const slot of slots) {
        assert.equal(typeof source[slot.sourceIndex], "string");
        assert.ok(source[slot.sourceIndex].length > 0);
        assert.ok(["object", "array"].includes(slot.jsonKind));
      }
    }
  }
});

test("the canary compiler emits eight deterministic bound files", async () => {
  const { compileCapabilityLayerBundle } = await import(
    "../src/capability-layer-abi.mjs"
  );
  const input = await loadCanaryInput("eternities-aegis");

  const left = compileCapabilityLayerBundle(input);
  const right = compileCapabilityLayerBundle(input);

  assert.deepEqual(left.files, right.files);
  assert.deepEqual(Object.keys(left.files).sort(), [
    "guardrails.v1.json",
    "input.schema.json",
    "manifest.v1.json",
    "method.v1.md",
    "output.schema.json",
    "reviewer.v1.md",
    "route-card.v1.json",
    "verifier.v1.json",
  ]);
  assert.match(left.manifest.bundleDigest, /^[a-f0-9]{64}$/);
});

test("compiled layers preserve exact sources and keep reduced layers closed", async () => {
  const {
    compileCapabilityLayerBundle,
    verifyCapabilityLayerBundle,
  } = await import("../src/capability-layer-abi.mjs");

  for (const capabilityId of [
    "eternities-aegis",
    "eternities-forge",
    "eternities-muse",
  ]) {
    const input = await loadCanaryInput(capabilityId);
    const bundle = compileCapabilityLayerBundle(input);
    const guardrails = JSON.parse(bundle.files["guardrails.v1.json"]);
    const verifier = JSON.parse(bundle.files["verifier.v1.json"]);
    const inputSchema = JSON.parse(bundle.files["input.schema.json"]);
    const outputSchema = JSON.parse(bundle.files["output.schema.json"]);

    assert.deepEqual(Object.keys(guardrails).sort(), [
      "capabilityId",
      "effects",
      "failureModes",
      "negativeTriggers",
      "schemaVersion",
      "successCondition",
      "terminationConditions",
    ].sort());
    assert.equal(verifier.status, "declared-not-executed");
    assert.equal(verifier.executedChecks, 0);
    assert.deepEqual(verifier.observations, []);
    assert.equal(Object.hasOwn(verifier, "passed"), false);
    assert.equal(inputSchema.additionalProperties, false);
    assert.equal(inputSchema.properties.slots.additionalProperties, false);
    assert.equal(outputSchema.additionalProperties, false);
    assert.equal(outputSchema.properties.slots.additionalProperties, false);
    assert.doesNotMatch(
      bundle.files["route-card.v1.json"],
      /bind the charge|Aegis loop|route contracts|generative visual law/i,
    );
    assert.match(
      bundle.files["method.v1.md"],
      new RegExp(JSON.parse(input.sources.contract.bytes).id),
    );
    assert.ok(bundle.files["method.v1.md"].includes(input.sources.entrypoint.bytes.toString("utf8").trimEnd()));
    assert.ok(bundle.files["method.v1.md"].includes(input.sources.operatingContract.bytes.toString("utf8").trimEnd()));
    assert.doesNotMatch(bundle.files["reviewer.v1.md"], /## (Aegis|Forge) loop|## route contracts/i);

    assert.deepEqual(verifyCapabilityLayerBundle({ bundle, ...input }), {
      valid: true,
      capabilityId,
      sourceCount: 4,
      layerCount: 7,
    });
  }
});

test("compiler and verifier reject identity drift, unsafe paths, duplicate slots, false proof, and changed bytes", async () => {
  const {
    canonicalJson,
    compileCapabilityLayerBundle,
    verifyCapabilityLayerBundle,
  } = await import("../src/capability-layer-abi.mjs");
  const validInput = await loadCanaryInput("eternities-aegis");

  const wrongContract = cloneCanaryInput(validInput);
  const contract = JSON.parse(wrongContract.sources.contract.bytes.toString("utf8"));
  contract.name = "other-capability";
  wrongContract.sources.contract.bytes = Buffer.from(JSON.stringify(contract));
  assert.throws(() => compileCapabilityLayerBundle(wrongContract), /contract.*identity/i);

  const unsafePath = cloneCanaryInput(validInput);
  unsafePath.canary.sources.entrypoint = "../escape/SKILL.md";
  unsafePath.sources.entrypoint.path = "../escape/SKILL.md";
  assert.throws(() => compileCapabilityLayerBundle(unsafePath), /source path|policy canary/i);

  const duplicateSlot = cloneCanaryInput(validInput);
  duplicateSlot.canary.inputSlots[1].id = duplicateSlot.canary.inputSlots[0].id;
  assert.throws(() => compileCapabilityLayerBundle(duplicateSlot), /duplicate.*slot|policy canary/i);

  const falseProof = cloneCanaryInput(validInput);
  falseProof.policy.verifierPolicy.initialStatus = "passed";
  falseProof.policySource.bytes = Buffer.from(canonicalJson(falseProof.policy));
  assert.throws(() => compileCapabilityLayerBundle(falseProof), /verifier.*status/i);

  const bundle = compileCapabilityLayerBundle(validInput);
  const changedBundle = structuredClone(bundle);
  changedBundle.files["guardrails.v1.json"] = changedBundle.files["guardrails.v1.json"].replace(
    '"schemaVersion": 1',
    '"schemaVersion": 2',
  );
  assert.throws(
    () => verifyCapabilityLayerBundle({ bundle: changedBundle, ...validInput }),
    /digest|bytes/i,
  );
});

test("digest-bound activation decisions disclose only the authorized layer phase", async (t) => {
  const [{ compileCapabilityLayerBundle, readCapabilityLayers }, { compileActivationDecision }] = await Promise.all([
    import("../src/capability-layer-abi.mjs"),
    import("../src/adaptive-activation.mjs"),
  ]);
  const adaptivePolicy = await json("policies/adaptive-activation.v1.json");
  const evidence = await json("artifacts/adaptive-activation/evidence.v1.json");
  const temporary = await mkdtemp(path.join(tmpdir(), "godskill-layer-abi-"));
  t.after(() => rm(temporary, { recursive: true, force: true }));

  async function materialize(capabilityId) {
    const input = await loadCanaryInput(capabilityId);
    const bundle = compileCapabilityLayerBundle(input);
    const directory = path.join(temporary, capabilityId);
    await mkdir(directory, { recursive: true });
    await Promise.all(Object.entries(bundle.files).map(([name, text]) =>
      writeFile(path.join(directory, name), text, "utf8")));
    return { bundle, directory };
  }

  const task = (taskClass, consequenceClass) => ({
    taskClass,
    consequenceClass,
    authorityProjection: {
      availableAuthority: ["local-read", "local-write"],
      permittedEffects: ["local-read", "local-write"],
    },
  });
  const aegis = await materialize("eternities-aegis");
  const muse = await materialize("eternities-muse");
  const decisions = {
    native: compileActivationDecision({
      selectedId: "eternities-aegis",
      task: task("general", "low"),
      policy: adaptivePolicy,
    }),
    guardrail: compileActivationDecision({
      selectedId: "eternities-aegis",
      task: task("general", "consequential"),
      policy: adaptivePolicy,
    }),
    method: compileActivationDecision({
      selectedId: "eternities-aegis",
      task: task("general", "consequential"),
      explicitMethodRequest: true,
      policy: adaptivePolicy,
    }),
    review: compileActivationDecision({
      selectedId: "eternities-muse",
      task: task("creative-generation", "consequential"),
      reviewAvailable: true,
      policy: adaptivePolicy,
      evidence,
    }),
  };

  async function observedRead({ target, decision, artifactAvailable = false }) {
    const paths = [];
    const result = await readCapabilityLayers({
      bundleDirectory: target.directory,
      manifest: target.bundle.manifest,
      activationDecision: decision,
      artifactAvailable,
      read: async (filePath) => {
        paths.push(path.basename(filePath));
        return readFile(filePath);
      },
    });
    return { paths, result };
  }

  const native = await observedRead({ target: aegis, decision: decisions.native });
  const guardrail = await observedRead({ target: aegis, decision: decisions.guardrail });
  const method = await observedRead({ target: aegis, decision: decisions.method });
  const reviewBefore = await observedRead({ target: muse, decision: decisions.review });
  const reviewAfter = await observedRead({
    target: muse,
    decision: decisions.review,
    artifactAvailable: true,
  });

  assert.deepEqual(native.paths, []);
  assert.deepEqual(guardrail.paths, ["guardrails.v1.json"]);
  assert.deepEqual(method.paths, ["method.v1.md"]);
  assert.deepEqual(reviewBefore.paths, []);
  assert.deepEqual(reviewAfter.paths, ["reviewer.v1.md"]);
  assert.equal(reviewBefore.result.deferredReview, true);
  assert.equal(reviewAfter.result.deferredReview, false);

  const forged = structuredClone(decisions.method);
  forged.reasonCodes = ["unearned-method"];
  await assert.rejects(() => readCapabilityLayers({
    bundleDirectory: aegis.directory,
    manifest: aegis.bundle.manifest,
    activationDecision: forged,
  }), /decision digest|method activation/i);
});
