import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function readJson(relative) {
  const text = await readFile(new URL(relative, root), "utf8").catch((error) =>
    assert.fail(`required adaptive evidence artifact is unavailable: ${relative}: ${error.message}`));
  return JSON.parse(text);
}

async function contracts() {
  return import("../src/adaptive-evidence-contracts.mjs").catch((error) =>
    assert.fail(`adaptive evidence contracts are unavailable: ${error.message}`));
}

function digestText(text) {
  return createHash("sha256").update(text).digest("hex");
}

const profileIdentity = Object.freeze({
  capabilityId: "eternities-aegis",
  taskClass: "security-review",
  modelFamily: "gpt-5.6-terra",
  reasoningTier: "high",
  consequenceClass: "consequential",
  capabilityVersion: "06eac79d2408c457eaabb7cc766982aaba6836b75ec8c124630b94d119b9b5a9",
  environmentId: "2db8aaf5083d257f8492363933eadaf0786998158f81dcf1a11c775b75c3979b",
});

test("trusted v2 policy closes evidence levels, trial variants, and lifecycle authority", async () => {
  const [{ canonicalJson, validateAdaptiveEvidencePolicy }, policy] = await Promise.all([
    contracts(),
    readJson("policies/adaptive-evidence.v2.json"),
  ]);
  const expectedKeys = [
    "activationFallbacks",
    "authorityExpanded",
    "consequenceClasses",
    "evidenceLevels",
    "fixtureEvidenceCanPromote",
    "historicalEvidenceCanPromote",
    "id",
    "lifecycleGrants",
    "methodPromotion",
    "profileKeyFields",
    "promotableEvidenceLevels",
    "reasoningTiers",
    "reviewPromotion",
    "runtimeModes",
    "schemaVersion",
    "selfPromotionAllowed",
    "selfReviewAllowed",
    "taskClasses",
    "trialVariants",
  ];

  assert.deepEqual(Object.keys(policy).sort(), expectedKeys);
  assert.deepEqual(policy.runtimeModes, ["native", "guardrail", "method", "review"]);
  assert.deepEqual(policy.trialVariants, ["raw", "guardrail", "method", "reviewer", "combined"]);
  assert.deepEqual(policy.profileKeyFields, [
    "capabilityId",
    "taskClass",
    "modelFamily",
    "reasoningTier",
    "consequenceClass",
    "capabilityVersion",
    "environmentId",
  ]);
  assert.deepEqual(policy.evidenceLevels, [
    "structural",
    "fixture",
    "artifact",
    "model",
    "cross-model",
    "field",
    "universal",
  ]);
  assert.deepEqual(policy.promotableEvidenceLevels, ["model", "cross-model", "field", "universal"]);
  assert.deepEqual(policy.lifecycleGrants, {
    promote: "adaptive-evidence:promote",
    demote: "adaptive-evidence:demote",
    quarantine: "adaptive-evidence:quarantine",
    invalidate: "adaptive-evidence:invalidate",
  });
  assert.equal(policy.fixtureEvidenceCanPromote, false);
  assert.equal(policy.historicalEvidenceCanPromote, false);
  assert.equal(policy.selfReviewAllowed, false);
  assert.equal(policy.selfPromotionAllowed, false);
  assert.equal(policy.authorityExpanded, false);

  const policyDigest = digestText(canonicalJson(policy));
  const validated = validateAdaptiveEvidencePolicy({ policy, expectedPolicyDigest: policyDigest });
  assert.equal(Object.isFrozen(validated), true);

  const forged = structuredClone(policy);
  forged.methodPromotion.minimumWins = 1;
  assert.throws(
    () => validateAdaptiveEvidencePolicy({ policy: forged, expectedPolicyDigest: policyDigest }),
    /trusted policy digest/i,
  );
});

test("profile identity is exact, closed, and sensitive to every qualified field", async () => {
  const { compileProfileIdentity, profileKey, sameProfileIdentity } = await contracts();
  const compiled = compileProfileIdentity(profileIdentity);
  const expectedCanonical = "{\"capabilityId\":\"eternities-aegis\",\"capabilityVersion\":\"06eac79d2408c457eaabb7cc766982aaba6836b75ec8c124630b94d119b9b5a9\",\"consequenceClass\":\"consequential\",\"environmentId\":\"2db8aaf5083d257f8492363933eadaf0786998158f81dcf1a11c775b75c3979b\",\"modelFamily\":\"gpt-5.6-terra\",\"reasoningTier\":\"high\",\"taskClass\":\"security-review\"}";

  assert.deepEqual(compiled, profileIdentity);
  assert.equal(Object.isFrozen(compiled), true);
  assert.equal(profileKey(compiled), digestText(expectedCanonical));
  assert.equal(sameProfileIdentity(compiled, structuredClone(profileIdentity)), true);

  for (const field of Object.keys(profileIdentity)) {
    const changedValue = ["capabilityVersion", "environmentId"].includes(field)
      ? "f".repeat(64)
      : `${profileIdentity[field]}-changed`;
    const changed = { ...profileIdentity, [field]: changedValue };
    assert.notEqual(profileKey(compileProfileIdentity(changed)), profileKey(compiled), field);
    assert.equal(sameProfileIdentity(compiled, changed), false, field);
  }

  const missing = structuredClone(profileIdentity);
  delete missing.environmentId;
  assert.throws(() => compileProfileIdentity(missing), /profile identity keys/i);
  assert.throws(
    () => compileProfileIdentity({ ...profileIdentity, providerAccount: "private" }),
    /profile identity keys/i,
  );
});

test("adaptive evidence schemas are closed at every object boundary", async () => {
  const { buildAdaptiveEvidenceSchemas } = await contracts();
  const schemas = buildAdaptiveEvidenceSchemas();
  assert.deepEqual(Object.keys(schemas), [
    "evidence-row.schema.json",
    "lifecycle-decision.schema.json",
    "profile.schema.json",
    "shadow-decision.schema.json",
    "trial-envelope.schema.json",
  ]);

  function assertClosedObjects(value, path = "schema") {
    if (!value || typeof value !== "object") return;
    if (value.type === "object") {
      assert.equal(value.additionalProperties, false, `${path} is not closed`);
      assert.ok(Array.isArray(value.required), `${path} has no required list`);
    }
    for (const [key, child] of Object.entries(value)) {
      assertClosedObjects(child, `${path}.${key}`);
    }
  }

  for (const [name, schema] of Object.entries(schemas)) {
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.match(schema.$id, /^urn:eternities:adaptive-evidence:v2:/);
    assertClosedObjects(schema, name);
  }
});
