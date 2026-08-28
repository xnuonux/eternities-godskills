import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { buildGodskillsSystemCertification } from "../scripts/build-godskills-system-certification.mjs";

const root = path.resolve(new URL("../", import.meta.url).pathname.slice(1));

test("final Godskills system certificate rebuilds from every current proof layer", async () => {
  const expected = JSON.parse(await readFile(path.join(root, "receipts/godskills-system-certification-v1.json"), "utf8"));
  const actual = await buildGodskillsSystemCertification({ root, write: false });
  assert.deepEqual(actual, expected);
  assert.equal(actual.status, "certified");
  assert.deepEqual(actual.counts, {
    sourceRecords: 4741,
    reviewedSources: 4741,
    clusteredSources: 4741,
    promotedSourceMembers: 579,
    promotedCards: 20,
    routingFamilies: 19,
    intentArenaCases: 144,
    compilerGeneralizationCases: 10,
    athenaCases: 12,
  });
});

test("final certificate preserves cold routing and explicit authority boundaries", async () => {
  const receipt = await buildGodskillsSystemCertification({ root, write: false });
  assert.deepEqual(receipt.gates, {
    allRoutingCardsExact: true,
    allSourcesReviewedAndClustered: true,
    allIntentArenasPass: true,
    authorityInventionCount: 0,
    unsafeSelectionCount: 0,
    supplyChainGatePromoted: true,
    usageEvolutionPromotedButNotAdopted: true,
    athenaPromoted: true,
    attestedContinuityCertified: true,
    externalActionExecution: false,
    hostActivationPerformed: false,
    pantheonEnabled: false,
  });
  assert.equal(receipt.proofLimits.arbitraryLiveLanguage, "not-proven");
  assert.equal(receipt.proofLimits.productionBehavior, "not-proven");
  assert.equal(receipt.proofLimits.hostKeyCustody, "not-proven");
});
