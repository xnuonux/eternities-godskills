import test from "node:test";
import assert from "node:assert/strict";

import { buildCoverageRows } from "../src/coverage.mjs";
import { sha256 } from "../src/io.mjs";
import { validateCandidateEvidence } from "../src/refinery-candidates.mjs";

const reviewA = "a".repeat(64);
const reviewB = "b".repeat(64);
const clusterDigest = "c".repeat(64);

function reviews(overrides = {}) {
  return [
    { sourceId: "source-a", reviewDigest: reviewA, copiedSourceProse: false, promotionClaim: false },
    { sourceId: "source-b", reviewDigest: reviewB, copiedSourceProse: false, promotionClaim: false },
  ].map((row) => ({ ...row, ...(overrides[row.sourceId] ?? {}) }));
}

function cluster(overrides = {}) {
  return {
    id: "cluster-a",
    familyId: "agency-client-services",
    synthesisDecision: "candidate",
    clusterDigest,
    members: [
      { sourceId: "source-a", reviewDigest: reviewA },
      { sourceId: "source-b", reviewDigest: reviewB },
    ],
    ...overrides,
  };
}

function receipt(overrides = {}) {
  return {
    skillName: "candidate-a",
    evidence: { sourceIds: ["source-a", "source-b"] },
    candidate: { status: "evaluated" },
    decision: { status: "promoted" },
    ...overrides,
  };
}

function record(overrides = {}) {
  const promotion = receipt();
  return {
    schemaVersion: 1,
    candidateId: "candidate-a",
    familyId: "agency-client-services",
    status: "promoted",
    artifacts: {
      skill: { path: "skills/candidate-a/SKILL.md", sha256: "1".repeat(64) },
      capabilityContract: { path: "skills/candidate-a/references/capability-contract.json", sha256: "2".repeat(64) },
      routingCard: { path: "skills/candidate-a/references/routing-card.json", sha256: "3".repeat(64) },
      evaluation: { path: "skills/candidate-a/evals/cases.json", sha256: "4".repeat(64) },
      promotionReceipt: {
        path: "receipts/promotions/candidate-a.json",
        sha256: sha256(`${JSON.stringify(promotion, null, 2)}\n`),
      },
    },
    clusters: [{ id: "cluster-a", digest: clusterDigest }],
    sourceIds: ["source-a", "source-b"],
    copiedSourceProse: false,
    externalMutation: false,
    synthesisMethod: "independent-cluster-synthesis-v1",
    ...overrides,
  };
}

function source(id) {
  return {
    id,
    name: id,
    sourcePath: `${id}/SKILL.md`,
    contentDigest: "d".repeat(64),
    families: ["agency-client-services"],
  };
}

function body(id) {
  return { sourceId: id, status: "inspected", present: true, bodySha256: "e".repeat(64), byteSize: 1, lineCount: 1 };
}

test("exact candidate evidence advances only exact reviewed cluster members", () => {
  const candidate = validateCandidateEvidence(record(), [cluster()], reviews(), receipt());
  const rows = buildCoverageRows(
    [source("source-a"), source("source-b")],
    [body("source-a"), body("source-b")],
    [],
    reviews().map((row) => ({ ...row, bodySha256: "e".repeat(64) })),
    [cluster()],
    [candidate],
  );
  assert.equal(rows.every(({ evidence }) => evidence.synthesized), true);
  assert.equal(rows.every(({ evidence }) => evidence.evaluated), true);
  assert.equal(rows.every(({ evidence }) => evidence.promoted), true);
});

test("candidate validation rejects cluster, source, and review drift", () => {
  assert.throws(() => validateCandidateEvidence(record(), [], reviews(), receipt()), /missing cluster/);
  assert.throws(
    () => validateCandidateEvidence(record(), [cluster({ clusterDigest: "f".repeat(64) })], reviews(), receipt()),
    /stale cluster digest/,
  );
  assert.throws(
    () => validateCandidateEvidence(record({ sourceIds: ["source-a"] }), [cluster()], reviews(), receipt()),
    /source union/,
  );
  assert.throws(
    () => validateCandidateEvidence(record(), [cluster()], reviews({ "source-b": { copiedSourceProse: true } }), receipt()),
    /copied source prose/,
  );
});

test("candidate validation rejects artifact and promotion drift", () => {
  assert.throws(
    () => validateCandidateEvidence(record({ artifacts: { ...record().artifacts, skill: { path: "", sha256: "1".repeat(64) } } }), [cluster()], reviews(), receipt()),
    /artifact path/,
  );
  assert.throws(
    () => validateCandidateEvidence(record({ artifacts: { ...record().artifacts, promotionReceipt: { path: "receipts/promotions/candidate-a.json", sha256: "0".repeat(64) } } }), [cluster()], reviews(), receipt()),
    /stale promotion receipt hash/,
  );
  const withReceipt = (value) => {
    const declaration = record();
    declaration.artifacts = {
      ...declaration.artifacts,
      promotionReceipt: {
        ...declaration.artifacts.promotionReceipt,
        sha256: sha256(`${JSON.stringify(value, null, 2)}\n`),
      },
    };
    return declaration;
  };
  const sourceDrift = receipt({ evidence: { sourceIds: ["source-a"] } });
  assert.throws(
    () => validateCandidateEvidence(withReceipt(sourceDrift), [cluster()], reviews(), sourceDrift),
    /receipt source ids/,
  );
  const unevaluated = receipt({ candidate: { status: "experimental" } });
  assert.throws(
    () => validateCandidateEvidence(withReceipt(unevaluated), [cluster()], reviews(), unevaluated),
    /not evaluated/,
  );
  const blocked = receipt({ decision: { status: "blocked" } });
  assert.throws(
    () => validateCandidateEvidence(withReceipt(blocked), [cluster()], reviews(), blocked),
    /not promoted/,
  );
});

test("an exact synthesized candidate does not invent evaluation or promotion", () => {
  const declaration = record({ status: "synthesized" });
  declaration.artifacts = { ...declaration.artifacts };
  delete declaration.artifacts.promotionReceipt;
  const candidate = validateCandidateEvidence(declaration, [cluster()], reviews(), null);
  assert.equal(candidate.evaluated, false);
  assert.equal(candidate.promoted, false);
});
