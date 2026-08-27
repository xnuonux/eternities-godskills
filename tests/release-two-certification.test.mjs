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

async function canonicalTextSha256(relative) {
  return sha256((await text(relative)).replaceAll("\r\n", "\n"));
}

test("release two certifies three engineering Godskills and one bounded profile", async () => {
  const names = [
    "eternities-architect",
    "eternities-forge",
    "eternities-aegis",
  ];
  const [certification, profile, ...receipts] = await Promise.all([
    json("receipts/release-two-certification.json"),
    json("receipts/history/release-two-profile-eternities-engineering.json"),
    ...names.map((name) => json(`receipts/promotions/${name}.json`)),
  ]);
  const contracts = [];
  const selectedSourceIds = new Set();

  assert.equal(certification.schemaVersion, 1);
  assert.equal(certification.status, "certified");
  assert.deepEqual(certification.criticalFailures, []);
  assert.equal(certification.scope.addedGodskills, 3);
  assert.equal(certification.scope.totalPromotedGodskills, 4);
  assert.equal(certification.scope.corpusWideRefinement, false);
  assert.equal(certification.scope.explicitPantheonEnabled, false);

  for (const [index, name] of names.entries()) {
    const receipt = receipts[index];
    const promotion = certification.promotions[name];
    const contract = await json(
      `skills/${name}/references/capability-contract.json`,
    );
    const baseline = receipt.baseline;
    const candidate = receipt.candidate;
    const decision = receipt.decision;
    contracts.push(contract);
    receipt.evidence.sourceIds.forEach((sourceId) => selectedSourceIds.add(sourceId));

    assert.equal(receipt.decision.status, "promoted");
    assert.equal(receipt.evidenceLevel, "contract-certified");
    assert.equal(receipt.limitation.includes("does not prove live-model"), true);
    assert.equal(receipt.candidate.criticalPassed, receipt.candidate.criticalTotal);
    assert.deepEqual(receipt.baseline, baseline);
    assert.deepEqual(receipt.candidate, candidate);
    assert.deepEqual(receipt.decision, decision);
    assert.equal(receipt.evidence.candidateSourceCoverage, receipt.evidence.sourceIds.length);
    assert.deepEqual([...receipt.evidence.sourceIds].sort(), [...contract.sourceIds].sort());
    assert.equal(receipt.evidence.sourceProseCopied, false);
    assert.match(receipt.evidence.skillSha256, /^[a-f0-9]{64}$/);
    assert.match(receipt.evidence.casesSha256, /^[a-f0-9]{64}$/);
    assert.match(receipt.evidence.policySha256, /^[a-f0-9]{64}$/);
    assert.equal(promotion.tokenCount, receipt.evidence.measuredTokenCount);
    assert.equal(
      promotion.receiptSha256,
      await canonicalTextSha256(`receipts/promotions/${name}.json`),
    );
    assert.doesNotThrow(() => validateCompositionContract(contract));
    assert.ok(
      contract.routes.every(
        ({ delegates }) => !delegates.includes(contract.name),
      ),
    );
  }
  assert.doesNotThrow(() => validateCompositionGraph(contracts));
  assert.equal(certification.composition.routeCount, 11);
  assert.equal(selectedSourceIds.size, certification.sourceEvidence.selectedSourceCount);
  const boundary = certification.provenanceBoundary;
  assert.match(boundary.ledgerPrefixSha256, /^[a-f0-9]{64}$/);
  assert.deepEqual([...selectedSourceIds].sort(), [...boundary.sourceIds].sort());
  assert.equal(certification.sourceEvidence.newProvenanceRows, 12);

  const activeNames = profile.links.map(({ name }) => name);
  assert.deepEqual(certification.profile.activeSkills, activeNames);
  assert.deepEqual(activeNames, [
    "eternities-aegis",
    "eternities-architect",
    "eternities-forge",
    "eternities-oracle",
    "sovereign-skill-refinery",
  ]);
  assert.equal(profile.verification.valid, true);
  assert.equal(
    profile.links.filter(({ createdByProfile }) => createdByProfile).length,
    certification.profile.createdLinks,
  );
  assert.equal(
    profile.links.filter(({ createdByProfile }) => !createdByProfile).length,
    certification.profile.preservedExactLinks,
  );
  assert.equal(certification.profile.freshPromptVerified, true);
  assert.equal(certification.profile.coldPayloadAbsent, true);
  assert.equal(certification.profile.pantheonDiscoverable, false);
  assert.equal(
    certification.profile.receiptSha256,
    await canonicalTextSha256(
      "receipts/history/release-two-profile-eternities-engineering.json",
    ),
  );

  assert.equal(certification.verification.testFailures, 0);
  assert.equal(certification.verification.testTotal, 87);
  assert.ok(certification.remainingUncertainty.length > 0);
});
