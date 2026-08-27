import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import {
  validateCompositionContract,
  validateCompositionGraph,
} from "../src/composition.mjs";
import { evaluateSuite } from "../src/evaluate.mjs";
import { canonicalText, sha256 } from "../src/io.mjs";
import { decidePromotion } from "../src/promote.mjs";
import { deriveSourceEvidence } from "../src/provenance-evidence.mjs";
import { validateProfileLock } from "../src/schema.mjs";
import { buildSkillReceipt } from "../scripts/evaluate-skill.mjs";

const root = new URL("../", import.meta.url);

async function text(relative) {
  return readFile(new URL(relative, root), "utf8");
}

async function json(relative) {
  return JSON.parse(await text(relative));
}

async function exists(relative) {
  try {
    await access(new URL(relative, root));
    return true;
  } catch {
    return false;
  }
}

async function canonicalSha256(relative) {
  return sha256(canonicalText(await text(relative)));
}

test("release four certifies Muse and an isolated reversible visual profile", async () => {
  const [
    certification,
    receipt,
    contract,
    suite,
    policy,
    visualProfile,
    engineeringProfile,
  ] = await Promise.all([
    json("receipts/release-four-certification.json"),
    json("receipts/promotions/eternities-muse.json"),
    json("skills/eternities-muse/references/capability-contract.json"),
    json("skills/eternities-muse/evals/cases.json"),
    json("policies/promotion.v1.json"),
    json("profiles/eternities-visual.lock.json"),
    json("profiles/eternities-engineering.lock.json"),
  ]);
  const skillText = canonicalText(await text("skills/eternities-muse/SKILL.md"));
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
  const releaseRows = ledger.filter(({ sourceId }) =>
    new Set(contract.sourceIds).has(sourceId),
  );

  assert.equal(certification.schemaVersion, 1);
  assert.equal(certification.status, "certified");
  assert.deepEqual(certification.criticalFailures, []);
  assert.equal(certification.scope.addedGodskills, 1);
  assert.equal(certification.scope.totalPromotedGodskills, 6);
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
    await canonicalSha256("receipts/promotions/eternities-muse.json"),
  );
  assert.equal(certification.promotion.tokenCount, candidate.tokenCount);
  assert.equal(certification.promotion.criticalCases, "17/17");
  assert.deepEqual(
    await buildSkillReceipt({
      skillPath: fileURLToPath(
        new URL("../skills/eternities-muse", import.meta.url),
      ),
      policyPath: fileURLToPath(
        new URL("../policies/promotion.v1.json", import.meta.url),
      ),
    }),
    receipt,
  );

  assert.doesNotThrow(() => validateCompositionContract(contract));
  assert.equal(contract.routes.length, certification.composition.routeCount);
  const globalContracts = await Promise.all(
    [
      "eternities-architect",
      "eternities-forge",
      "eternities-aegis",
      "eternities-mnemosyne",
      "eternities-muse",
    ].map((name) => json(`skills/${name}/references/capability-contract.json`)),
  );
  assert.doesNotThrow(() => validateCompositionGraph(globalContracts));
  assert.equal(globalContracts.length, certification.composition.globalGodskillCount);
  assert.equal(
    globalContracts.reduce((total, value) => total + value.routes.length, 0),
    certification.composition.globalRouteCount,
  );
  assert.equal(certification.composition.compositionCycles, 0);
  assert.equal(certification.composition.recursiveRoutes, 0);

  assert.equal(releaseRows.length, 4);
  assert.equal(
    releaseRows.filter(({ disposition }) => disposition === "pattern-reference").length,
    certification.sourceEvidence.patternOnlyCount,
  );
  assert.equal(
    releaseRows.filter(({ disposition }) => disposition === "independent-implementation").length,
    certification.sourceEvidence.independentImplementationCount,
  );
  assert.equal(certification.sourceEvidence.sourceProseCopied, false);

  assert.doesNotThrow(() => validateProfileLock(visualProfile));
  assert.deepEqual(visualProfile.skills.map(({ name }) => name), ["eternities-muse"]);
  assert.equal(
    engineeringProfile.skills.some(({ name }) => name === "eternities-muse"),
    false,
  );
  assert.equal(engineeringProfile.skills.length, 6);

  if (certification.profile.activationDeferredUntilCanonicalMerge) {
    assert.equal(await exists("receipts/profile-eternities-visual.json"), false);
    assert.equal(
      await exists("receipts/profile-eternities-visual-release-four-migration.json"),
      false,
    );
    assert.equal(certification.profile.canonicalActivationVerified, false);
    assert.equal(certification.profile.receiptSha256, null);
    assert.equal(certification.profile.migrationReceiptSha256, null);
  } else {
    const [profileReceipt, migrationReceipt] = await Promise.all([
      json("receipts/profile-eternities-visual.json"),
      json("receipts/profile-eternities-visual-release-four-migration.json"),
    ]);
    assert.deepEqual(profileReceipt.links.map(({ name }) => name), ["eternities-muse"]);
    assert.ok(
      profileReceipt.links.every(
        ({ linkTarget, promotionReceipt }) =>
          linkTarget.startsWith("C:\\dev\\eternities-godskills\\") &&
          promotionReceipt.startsWith("C:\\dev\\eternities-godskills\\") &&
          !linkTarget.includes(".worktrees") &&
          !promotionReceipt.includes(".worktrees"),
      ),
    );
    assert.deepEqual(profileReceipt.verification.required, ["eternities-muse"]);
    assert.equal(profileReceipt.verification.valid, true);
    assert.deepEqual(migrationReceipt.links.map(({ name }) => name), ["eternities-muse"]);
    assert.deepEqual(migrationReceipt.rollbackDryRun.planned, ["eternities-muse"]);
    assert.deepEqual(migrationReceipt.rollbackDryRun.refused, []);
    assert.equal(certification.profile.canonicalActivationVerified, true);
    assert.equal(
      certification.profile.receiptSha256,
      await canonicalSha256("receipts/profile-eternities-visual.json"),
    );
    assert.equal(
      certification.profile.migrationReceiptSha256,
      await canonicalSha256(
        "receipts/profile-eternities-visual-release-four-migration.json",
      ),
    );
  }

  assert.equal(certification.profile.temporaryWorktreeLinksCreated, false);
  assert.equal(certification.verification.testFailures, 0);
  assert.equal(certification.verification.sourceCoverageDerivedFromLedger, true);
  assert.ok(certification.remainingUncertainty.length > 0);
});
