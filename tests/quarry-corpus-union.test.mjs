import assert from "node:assert/strict";
import test from "node:test";

import { unionQuarryEvidence } from "../src/quarry-corpus-union.mjs";

const sharedDigest = "a".repeat(64);
const waveTwoDigest = "b".repeat(64);
const waveThreeDigest = "c".repeat(64);

function source(id, bodySha256) {
  return { id, bodySha256, inert: true };
}

function security(id, bodySha256) {
  return {
    id,
    bodySha256,
    disposition: "clear-for-semantic-review",
    requiredReview: "semantic",
    surfaces: [],
    findings: [],
  };
}

const waveTwo = {
  id: "wave-2",
  sources: [source("wave2:a", sharedDigest), source("wave2:only", waveTwoDigest)],
  securityRows: [security("wave2:a", sharedDigest), security("wave2:only", waveTwoDigest)],
  bodyStructures: [
    { bodySha256: sharedDigest, structure: { frontmatterName: "shared" } },
    { bodySha256: waveTwoDigest, structure: { frontmatterName: "wave two" } },
  ],
};

const waveThree = {
  id: "wave-3",
  sources: [source("wave3:b", sharedDigest), source("wave3:only", waveThreeDigest)],
  securityRows: [security("wave3:b", sharedDigest), security("wave3:only", waveThreeDigest)],
  bodyStructures: [
    { bodySha256: sharedDigest, structure: { frontmatterName: "shared" } },
    { bodySha256: waveThreeDigest, structure: { frontmatterName: "wave three" } },
  ],
};

test("cross-wave duplicates share one canonical body and retain every alias", () => {
  const result = unionQuarryEvidence({ waves: [waveTwo, waveThree] });
  assert.equal(result.sources.length, 4);
  assert.equal(result.canonicalBodies.length, 3);
  assert.deepEqual(result.aliasesByDigest[sharedDigest], ["wave2:a", "wave3:b"]);
  assert.deepEqual(result.waveIds, ["wave-2", "wave-3"]);
});

test("union coalesces exact repeated identities but rejects conflicting duplicate source ids", () => {
  const repeatedIdentityWave = {
    id: "repeated-identity-wave",
    sources: [source("wave2:a", sharedDigest)],
    securityRows: [security("wave2:a", sharedDigest)],
    bodyStructures: [{ bodySha256: sharedDigest, structure: { frontmatterName: "shared" } }],
  };
  const coalesced = unionQuarryEvidence({ waves: [waveTwo, repeatedIdentityWave] });
  assert.equal(coalesced.sources.length, 2);
  assert.equal(coalesced.rawSourceRecordCount, 3);
  assert.equal(coalesced.coalescedDuplicateSourceRecordCount, 1);
  assert.deepEqual(coalesced.sourceWaveIdsById["wave2:a"], ["repeated-identity-wave", "wave-2"]);

  const duplicateIdWave = {
    ...waveThree,
    id: "duplicate-id-wave",
    sources: [source("wave2:a", waveThreeDigest)],
    securityRows: [security("wave2:a", waveThreeDigest)],
    bodyStructures: [{ bodySha256: waveThreeDigest, structure: { frontmatterName: "duplicate" } }],
  };
  assert.throws(() => unionQuarryEvidence({ waves: [waveTwo, duplicateIdWave] }), /conflicting duplicate source id/);
});

test("union rejects stale security and missing structures", () => {

  const staleSecurityWave = {
    ...waveThree,
    id: "stale-security-wave",
    securityRows: [security("wave3:b", waveThreeDigest), security("wave3:only", waveThreeDigest)],
  };
  assert.throws(() => unionQuarryEvidence({ waves: [waveTwo, staleSecurityWave] }), /security body digest drift/);

  const missingStructureWave = { ...waveThree, id: "missing-structure-wave", bodyStructures: [] };
  assert.throws(() => unionQuarryEvidence({ waves: [waveTwo, missingStructureWave] }), /missing body structure/);
});

test("union rejects conflicting structures for the same exact body", () => {
  const conflictingWave = {
    ...waveThree,
    id: "conflicting-structure-wave",
    bodyStructures: [
      { bodySha256: sharedDigest, structure: { frontmatterName: "not shared" } },
      { bodySha256: waveThreeDigest, structure: { frontmatterName: "wave three" } },
    ],
  };
  assert.throws(() => unionQuarryEvidence({ waves: [waveTwo, conflictingWave] }), /conflicting body structure/);
});
