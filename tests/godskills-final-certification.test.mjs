import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { buildGodskillsSystemCertification, certificationStatus, quarryAuditMatches, verifyBoundArtifacts } from "../scripts/build-godskills-system-certification.mjs";
import { sha256 } from "../src/io.mjs";

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

test("final certification fails closed for router and prohibited-action evidence", () => {
  const baseline = {
    gates: {
      allRoutingCardsExact: true,
      authorityInventionCount: 0,
      unsafeSelectionCount: 0,
      externalActionExecution: false,
      hostActivationPerformed: false,
      pantheonEnabled: false,
    },
    reconciliation: { completionExact: true, routerExact: true, allCompletionExternalActionsProhibited: true },
  };
  assert.equal(certificationStatus(baseline), "certified");
  assert.equal(certificationStatus({ ...baseline, reconciliation: { ...baseline.reconciliation, routerExact: false } }), "failed");
  assert.equal(certificationStatus({ ...baseline, reconciliation: { ...baseline.reconciliation, allCompletionExternalActionsProhibited: false } }), "failed");
});

test("a stale live quarry audit cannot equal the frozen certification evidence", async () => {
  const frozen = JSON.parse(await readFile(path.join(root, "receipts/github-skill-quarry-wave-2-audit.json"), "utf8"));
  assert.equal(quarryAuditMatches(frozen, frozen), true);
  assert.equal(quarryAuditMatches({ ...frozen, receiptSha256: "0".repeat(64) }, frozen), false);
});

test("bound artifact verification rejects stale Athena or quarry-style evidence", async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "godskills-cert-"));
  await writeFile(path.join(fixture, "artifact.txt"), "exact\n");
  const document = { evidence: { path: "artifact.txt", sha256: sha256("exact\n") } };
  assert.equal((await verifyBoundArtifacts(fixture, document)).exact, true);
  await writeFile(path.join(fixture, "artifact.txt"), "stale\n");
  assert.equal((await verifyBoundArtifacts(fixture, document)).exact, false);
});
