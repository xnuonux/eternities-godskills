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
    json("receipts/profile-eternities-engineering.json"),
    ...names.map((name) => json(`receipts/promotions/${name}.json`)),
  ]);
  const ledger = (await text("provenance/source-ledger.jsonl"))
    .trim()
    .split(/\r?\n/)
    .map(JSON.parse);
  const policy = await json("policies/promotion.v1.json");
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
    const suite = await json(`skills/${name}/evals/cases.json`);
    const skillText = canonicalText(await text(`skills/${name}/SKILL.md`));
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
    contracts.push(contract);
    sourceEvidence.sourceIds.forEach((sourceId) => selectedSourceIds.add(sourceId));

    assert.equal(receipt.decision.status, "promoted");
    assert.equal(receipt.evidenceLevel, "contract-certified");
    assert.equal(receipt.limitation.includes("does not prove live-model"), true);
    assert.equal(receipt.candidate.criticalPassed, receipt.candidate.criticalTotal);
    assert.deepEqual(receipt.baseline, baseline);
    assert.deepEqual(receipt.candidate, candidate);
    assert.deepEqual(receipt.decision, decision);
    assert.equal(receipt.evidence.candidateSourceCoverage, sourceEvidence.sourceCoverage);
    assert.deepEqual(receipt.evidence.sourceIds, sourceEvidence.sourceIds);
    assert.equal(receipt.evidence.sourceProseCopied, false);
    assert.equal(receipt.evidence.skillSha256, sha256(skillText));
    assert.equal(
      receipt.evidence.casesSha256,
      sha256(canonicalText(await text(`skills/${name}/evals/cases.json`))),
    );
    assert.equal(
      receipt.evidence.policySha256,
      sha256(canonicalText(await text("policies/promotion.v1.json"))),
    );
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
  assert.equal(
    contracts.reduce((total, contract) => total + contract.routes.length, 0),
    certification.composition.routeCount,
  );
  assert.equal(selectedSourceIds.size, certification.sourceEvidence.selectedSourceCount);
  assert.equal(ledger.length - 10, certification.sourceEvidence.newProvenanceRows);

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
    await canonicalTextSha256("receipts/profile-eternities-engineering.json"),
  );

  assert.equal(certification.verification.testFailures, 0);
  assert.equal(certification.verification.testTotal, 87);
  assert.ok(certification.remainingUncertainty.length > 0);
});
