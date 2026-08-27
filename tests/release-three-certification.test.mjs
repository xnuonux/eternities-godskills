import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  validateCompositionContract,
  validateCompositionGraph,
} from "../src/composition.mjs";
import { evaluateSuite } from "../src/evaluate.mjs";
import { canonicalText, sha256 } from "../src/io.mjs";
import { decidePromotion } from "../src/promote.mjs";
import { deriveSourceEvidence } from "../src/provenance-evidence.mjs";

const root = new URL("../", import.meta.url);

async function text(relative) {
  return readFile(new URL(relative, root), "utf8");
}

async function json(relative) {
  return JSON.parse(await text(relative));
}

async function canonicalSha256(relative) {
  return sha256(canonicalText(await text(relative)));
}

test("release three certifies Mnemosyne and a deferred canonical profile activation", async () => {
  const [certification, receipt, contract, suite, policy, profile] =
    await Promise.all([
      json("receipts/release-three-certification.json"),
      json("receipts/promotions/eternities-mnemosyne.json"),
      json("skills/eternities-mnemosyne/references/capability-contract.json"),
      json("skills/eternities-mnemosyne/evals/cases.json"),
      json("policies/promotion.v1.json"),
      json("profiles/eternities-engineering.lock.json"),
    ]);
  const skillText = canonicalText(
    await text("skills/eternities-mnemosyne/SKILL.md"),
  );
  const ledger = (await text("provenance/source-ledger.jsonl"))
    .trim()
    .split(/\r?\n/)
    .map(JSON.parse);
  const sourceEvidence = deriveSourceEvidence(contract, ledger);
  const baseline = {
    ...evaluateSuite(suite.cases, suite.baseline.results),
    tokenCount: suite.baseline.tokenCount,
  };
  const candidate = {
    ...evaluateSuite(suite.cases, suite.candidate.results),
    tokenCount: Math.ceil(Buffer.byteLength(skillText, "utf8") / 4),
    improvements:
      sourceEvidence.sourceCoverage > suite.baseline.sourceCoverage
        ? ["sourceCoverage"]
        : [],
  };
  const decision = decidePromotion({ baseline, candidate, policy });
  const releaseSourceIds = new Set(contract.sourceIds);
  const releaseRows = ledger.filter(({ sourceId }) => releaseSourceIds.has(sourceId));

  assert.equal(certification.schemaVersion, 1);
  assert.equal(certification.status, "certified");
  assert.deepEqual(certification.criticalFailures, []);
  assert.equal(certification.scope.addedGodskills, 1);
  assert.equal(certification.scope.totalPromotedGodskills, 5);
  assert.equal(certification.scope.explicitPantheonEnabled, false);

  assert.equal(receipt.decision.status, "promoted");
  assert.equal(receipt.evidenceLevel, "contract-certified");
  assert.equal(receipt.limitation.includes("does not prove live-model"), true);
  assert.deepEqual(receipt.baseline, baseline);
  assert.deepEqual(receipt.candidate, candidate);
  assert.deepEqual(receipt.decision, decision);
  assert.equal(receipt.evidence.skillSha256, sha256(skillText));
  assert.equal(receipt.evidence.sourceProseCopied, false);
  assert.deepEqual(receipt.evidence.sourceIds, sourceEvidence.sourceIds);
  assert.equal(
    certification.promotion.receiptSha256,
    await canonicalSha256("receipts/promotions/eternities-mnemosyne.json"),
  );
  assert.equal(certification.promotion.tokenCount, candidate.tokenCount);
  assert.equal(certification.promotion.criticalCases, "12/12");

  assert.doesNotThrow(() => validateCompositionContract(contract));
  assert.equal(contract.routes.length, certification.composition.routeCount);
  assert.equal(certification.composition.recursiveRoutes, 0);
  const globalContracts = await Promise.all(
    [
      "eternities-architect",
      "eternities-forge",
      "eternities-aegis",
      "eternities-mnemosyne",
    ].map((name) =>
      json(`skills/${name}/references/capability-contract.json`),
    ),
  );
  assert.doesNotThrow(() => validateCompositionGraph(globalContracts));
  assert.equal(globalContracts.length, certification.composition.globalGodskillCount);
  assert.equal(
    globalContracts.reduce((total, value) => total + value.routes.length, 0),
    certification.composition.globalRouteCount,
  );
  assert.equal(releaseRows.length, 5);
  assert.equal(
    releaseRows.filter(({ disposition }) => disposition === "pattern-reference").length,
    certification.sourceEvidence.patternOnlyCount,
  );
  assert.equal(
    releaseRows.filter(({ disposition }) => disposition === "independent-implementation").length,
    certification.sourceEvidence.independentImplementationCount,
  );

  const profileNames = profile.skills.map(({ name }) => name);
  assert.deepEqual(profileNames, certification.profile.lockedSkills);
  assert.equal(profileNames.includes("eternities-mnemosyne"), true);
  assert.equal(profileNames.length, 6);
  assert.equal(certification.profile.activationDeferredUntilCanonicalMerge, true);
  assert.equal(certification.verification.testTotal, 92);
  assert.equal(certification.verification.testFailures, 0);
  assert.equal(certification.verification.transitiveCompositionCyclesRejected, true);
  assert.ok(certification.remainingUncertainty.length > 0);
});
