import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { validateCompositionContract } from "../src/composition.mjs";
import { sha256 } from "../src/io.mjs";

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

    assert.equal(receipt.decision.status, "promoted");
    assert.equal(receipt.candidate.criticalPassed, receipt.candidate.criticalTotal);
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
  assert.equal(certification.profile.freshPromptVerified, true);
  assert.equal(certification.profile.coldPayloadAbsent, true);
  assert.equal(certification.profile.pantheonDiscoverable, false);
  assert.equal(
    certification.profile.receiptSha256,
    await canonicalTextSha256("receipts/profile-eternities-engineering.json"),
  );

  assert.equal(certification.verification.testFailures, 0);
  assert.ok(certification.verification.testTotal >= 76);
  assert.ok(certification.remainingUncertainty.length > 0);
});
