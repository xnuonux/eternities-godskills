import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { buildGodskillsSystemV2, certificationStatusV2 } from "../scripts/build-godskills-system-v2-certification.mjs";
import { sha256 } from "../src/io.mjs";

const rootUrl = new URL("../", import.meta.url);
const root = rootUrl.pathname.replace(/^\/(.:)/, "$1");

test("system v2 certifies total quarry infusion and twenty-one cold routes", async () => {
  const expected = JSON.parse(await readFile(new URL("receipts/godskills-system-certification-v2.json", rootUrl), "utf8"));
  const actual = await buildGodskillsSystemV2({ root, write: false });
  assert.deepEqual(actual, expected);
  assert.equal(actual.status, "certified");
  assert.deepEqual(actual.counts, {
    legacyReviewedSources: 4741,
    quarrySources: 7776,
    canonicalBodies: 3581,
    canonicalFacets: actual.counts.canonicalFacets,
    securityRejectedCanonicalBodies: actual.counts.securityRejectedCanonicalBodies,
    exactDuplicates: 4195,
    unresolvedQuarrySources: 0,
    promotedCards: 21,
    routingFamilies: 20,
    intentArenaCases: 148,
  });
});

test("system v2 binds every proof receipt and historical v1 routing checkpoint", async () => {
  const receipt = await buildGodskillsSystemV2({ root, write: false });
  for (const artifact of Object.values(receipt.artifacts)) {
    assert.equal(artifact.sha256, sha256(await readFile(new URL(artifact.path, rootUrl))), artifact.path);
  }
  assert.equal(receipt.gates.historicalV1RoutingCheckpointExact, true);
  assert.equal(receipt.gates.sourceInstructionsActivated, false);
  assert.equal(receipt.gates.thirdPartyCodeExecuted, false);
  assert.equal(receipt.gates.hostActivationPerformed, false);
});

test("system v2 status fails closed on incomplete coverage or activation", () => {
  const base = { exact: true, terminalCoverage: true, coldAndInert: true, noActivation: true };
  assert.equal(certificationStatusV2(base), "certified");
  assert.equal(certificationStatusV2({ ...base, terminalCoverage: false }), "failed");
  assert.equal(certificationStatusV2({ ...base, noActivation: false }), "failed");
});
