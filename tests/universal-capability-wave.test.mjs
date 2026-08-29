import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  buildUniversalCapabilityWave,
  certifyUniversalCapabilityCoverage,
} from "../src/universal-capability-wave.mjs";

const root = new URL("../", import.meta.url);
const synthesisPlan = JSON.parse(fs.readFileSync(new URL("data/wave2-synthesis-plan.v1.json", root)));
const clusterEvidence = fs.readFileSync(new URL("artifacts/wave2-semantic/cluster-evidence.jsonl", root), "utf8")
  .trim().split(/\r?\n/).map(JSON.parse);
const reviewEvidence = fs.readFileSync(new URL("artifacts/wave2-semantic/review-evidence.jsonl", root), "utf8")
  .trim().split(/\r?\n/).map(JSON.parse);

const EXPECTED_OPERATIONAL = [
  "approval-bound-private-session-mining",
  "bounded-service-shutdown",
  "bounded-verified-object-ingestion",
  "columnar-ingestion-rollup-and-query-layout-design",
  "confirmed-destructive-reconstruction",
  "diagnostic-statistical-model-inference",
  "docx-package-redline-and-render-verification",
  "formula-preserving-workbook-engineering",
  "fp-ts-functional-refactoring",
  "genomic-coordinate-assembly-and-variant-gates",
  "idempotent-api-rate-limit-recovery",
  "interface-localization-and-bidirectionality",
  "k6-performance-release-gate-duplicates",
  "lazy-tabular-transformation-and-validation",
  "measured-paid-creative-iteration",
  "measured-web-performance-optimization",
  "physics-constrained-numerical-validation",
  "semantic-implementation-equivalence-tracing",
  "stage-aware-venture-falsification-and-planning",
  "symbolic-mathematics-implementation",
  "contract-first-algorithm-correctness",
  "defensive-release-script-engineering",
].sort();

const EXPECTED_EXTENSIONS = [
  "accessible-async-interface-state-machine",
  "audit-remediation-root-cause-and-regression-review",
  "behavioral-test-maintainability-review",
  "bounded-typed-graphql-contract-and-execution",
  "configuration-schema-environment-and-migration-validation",
  "consent-gated-decision-linked-telemetry",
  "cross-boundary-semantic-contract-propagation-audit",
  "evidence-bound-data-modeling-schema-change-and-inspection",
  "evidence-derived-engineering-documentation",
  "evidence-first-data-path-performance-reduction",
  "evidence-led-product-discovery-and-prioritization",
  "fp-ts-react-state-validation-and-effects",
  "immersive-comfort-and-spatial-interaction",
  "incremental-dependency-and-framework-upgrades",
  "monorepo-release-graph-cache-correctness",
  "node-package-release-reproducibility",
  "offline-pwa-release-readiness",
  "precommitted-product-experimentation-gate",
  "question-driven-telemetry-self-verification",
  "realtime-3d-performance-and-spatial-systems",
  "red-green-refactor-behavior-proof",
  "rendered-spatial-measurement-and-adjudication",
  "research-proposal-planning-and-review",
  "share-preview-metadata-validation",
  "subscription-retention-and-payment-recovery",
  "reasoned-persistent-code-dependency-graph",
].sort();

function build(overrides = {}) {
  return buildUniversalCapabilityWave({ synthesisPlan, clusterEvidence, reviewEvidence, ...overrides });
}

function deepKeys(value, keys = []) {
  if (Array.isArray(value)) return value.flatMap((item) => deepKeys(item, keys));
  if (!value || typeof value !== "object") return keys;
  for (const [key, child] of Object.entries(value)) {
    keys.push(key);
    deepKeys(child, keys);
  }
  return keys;
}

test("the construction wave contains the literal 22 operational and 26 extension targets", () => {
  const wave = build();
  const operational = wave.targets.filter((row) => row.kind === "operational-skill").map((row) => row.clusterId).sort();
  const extensions = wave.targets.filter((row) => row.kind === "godskill-extension").map((row) => row.clusterId).sort();

  assert.deepEqual(operational, EXPECTED_OPERATIONAL);
  assert.deepEqual(extensions, EXPECTED_EXTENSIONS);
  assert.equal(wave.targets.length, 48);
  assert.equal(new Set(wave.targets.map((row) => row.targetId)).size, 48);
});

test("every target binds exact cluster and review evidence", () => {
  const wave = build();
  const clusterById = new Map(clusterEvidence.map((row) => [`${row.familyId}::${row.id}`, row]));

  for (const target of wave.targets) {
    const cluster = clusterById.get(`${target.familyId}::${target.clusterId}`);
    assert.equal(target.clusterDigest, cluster.clusterDigest);
    assert.deepEqual(target.reviewDigests, cluster.members.map((member) => member.reviewDigest).sort());
    assert.ok(target.reviewDigests.every((digest) => reviewEvidence.some((review) => review.reviewDigest === digest)));
  }
});

test("priority is neutral, bounded, explainable, and byte deterministic", () => {
  const left = build();
  const right = build();
  assert.equal(JSON.stringify(left), JSON.stringify(right));

  const dimensions = [
    "crossDomainApplicability",
    "compositionalLeverage",
    "mechanismDistinctness",
    "evidenceAndTestability",
    "authorityNeutralityAndSafeLocalOperation",
    "implementationTractability",
  ];
  for (const target of left.targets) {
    assert.deepEqual(Object.keys(target.priority.dimensions), dimensions);
    for (const score of Object.values(target.priority.dimensions)) assert.ok(Number.isInteger(score) && score >= 0 && score <= 5);
    assert.equal(target.priority.total, Object.values(target.priority.dimensions).reduce((sum, score) => sum + score, 0));
    assert.ok(target.priority.evidence.length >= 6);
  }

  assert.equal(deepKeys(left).some((key) => /lunari/i.test(key)), false);
  const ordered = [...left.targets].sort((a, b) =>
    b.priority.total - a.priority.total || a.familyId.localeCompare(b.familyId) || a.clusterId.localeCompare(b.clusterId));
  assert.deepEqual(left.targets, ordered);
});

test("categorical and implementation ownership remain explicit", () => {
  const wave = build();
  const shutdown = wave.targets.find((row) => row.clusterId === "bounded-service-shutdown");
  const graphql = wave.targets.find((row) => row.clusterId === "bounded-typed-graphql-contract-and-execution");
  const fpReact = wave.targets.find((row) => row.clusterId === "fp-ts-react-state-validation-and-effects");

  assert.equal(shutdown.categoricalOwnerId, "eternities-daedalus");
  assert.equal(shutdown.implementationOwnerId, "bounded-service-shutdown");
  assert.equal(graphql.categoricalOwnerId, "eternities-daedalus");
  assert.equal(graphql.implementationOwnerId, "eternities-daedalus");
  assert.equal(fpReact.categoricalOwnerId, "eternities-daedalus");
  assert.equal(fpReact.implementationOwnerId, "fp-ts-functional-refactoring");
});

test("missing, stale, duplicate, and unknown evidence fails closed", () => {
  const target = synthesisPlan.entries.find((entry) => entry.action === "synthesize-operational-skill");
  const targetKey = `${target.familyId}::${target.clusterId}`;
  const clustersWithoutTarget = clusterEvidence.filter((row) => `${row.familyId}::${row.id}` !== targetKey);
  assert.throws(() => build({ clusterEvidence: clustersWithoutTarget }), /missing cluster evidence/);

  const staleClusters = clusterEvidence.map((row) => `${row.familyId}::${row.id}` === targetKey
    ? { ...row, clusterDigest: "f".repeat(64) }
    : row);
  assert.throws(() => build({ clusterEvidence: staleClusters }), /stale cluster evidence/);

  assert.throws(() => build({ reviewEvidence: [...reviewEvidence, reviewEvidence[0]] }), /duplicate review evidence/);

  const changedPlan = structuredClone(synthesisPlan);
  changedPlan.entries.find((entry) => entry.clusterId === "research-proposal-planning-and-review").ownerSkillId = "unknown-owner";
  assert.throws(() => build({ synthesisPlan: changedPlan }), /unknown implementation owner/);
});

test("coverage certification detects omission, duplication, and reordered priority", () => {
  const wave = build();
  const coverage = certifyUniversalCapabilityCoverage(wave.targets);
  assert.deepEqual(coverage, {
    schemaVersion: 1,
    targetCount: 48,
    operationalSkillCount: 22,
    godskillExtensionCount: 26,
    unresolvedInputBindingCount: 0,
  });

  assert.throws(() => certifyUniversalCapabilityCoverage(wave.targets.slice(1)), /requires exactly 48 targets/);
  assert.throws(() => certifyUniversalCapabilityCoverage([...wave.targets, wave.targets[0]]), /requires exactly 48 targets/);
  assert.throws(() => certifyUniversalCapabilityCoverage([...wave.targets].reverse()), /priority order/);
});
