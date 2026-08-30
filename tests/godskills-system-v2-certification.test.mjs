import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { certificationStatusV2 } from "../scripts/build-godskills-system-v2-certification.mjs";
import { sha256 } from "../src/io.mjs";

const rootUrl = new URL("../", import.meta.url);
const root = rootUrl.pathname.replace(/^\/(.:)/, "$1");

test("system v2 certifies total quarry infusion and twenty-one cold routes", async () => {
  const receiptBytes = await readFile(new URL("receipts/godskills-system-certification-v2.json", rootUrl));
  const receipt = JSON.parse(receiptBytes);
  assert.equal(sha256(receiptBytes), "cf55d8a361c79b6fe40eba67d1df6feef1066bb379db1af96ca998c6503528c1");
  assert.equal(receipt.status, "certified");
  assert.deepEqual(receipt.counts, {
    legacyReviewedSources: 4741,
    quarrySources: 7776,
    canonicalBodies: 3581,
    canonicalFacets: receipt.counts.canonicalFacets,
    securityRejectedCanonicalBodies: receipt.counts.securityRejectedCanonicalBodies,
    exactDuplicates: 4195,
    unresolvedQuarrySources: 0,
    promotedCards: 21,
    routingFamilies: 20,
    intentArenaCases: 148,
  });
});

test("system v2 remains historical while v8 preserves its router checkpoint", async () => {
  const receipt = JSON.parse(await readFile(new URL("receipts/godskills-system-certification-v2.json", rootUrl), "utf8"));
  const router = JSON.parse(await readFile(new URL("receipts/agent-native-router-v7.json", rootUrl), "utf8"));
  assert.equal(router.artifacts.cardsSha256, sha256(await readFile(new URL("artifacts/checkpoints/agent-native-router-v8/cards.v7.jsonl", rootUrl))));
  assert.equal(router.artifacts.familyMapSha256, sha256(await readFile(new URL("artifacts/checkpoints/agent-native-router-v8/family-map.v7.json", rootUrl))));
  assert.equal(router.artifacts.manifestSha256, sha256(await readFile(new URL("artifacts/checkpoints/agent-native-router-v8/manifest.v7.json", rootUrl))));
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
