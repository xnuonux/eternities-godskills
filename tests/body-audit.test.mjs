import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { auditBody } from "../src/body-audit.mjs";
import { buildCorpusCoverage } from "../scripts/build-corpus-coverage.mjs";
import { sha256 } from "../src/io.mjs";
import { validateReviewBatch } from "../src/reviews.mjs";

function record(overrides = {}) {
  return {
    schemaVersion: 1,
    id: "skill-a",
    name: "Agency Client",
    description: "Onboard an agency client",
    enhancedSummary: "",
    sourcePath: "repo\\skill-a\\SKILL.md",
    repositoryRoot: "repo",
    contentDigest: "a".repeat(64),
    licenseClass: "permissive",
    confidence: "high",
    tags: [],
    triggers: [],
    operations: [],
    families: ["agency-client-services"],
    ...overrides,
  };
}

async function temporary(context) {
  const root = await mkdtemp(path.join(os.tmpdir(), "eternities-corpus-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

test("body audit records exact inert file evidence", async (context) => {
  const root = await temporary(context);
  const target = path.join(root, "repo", "skill-a", "SKILL.md");
  await mkdir(path.dirname(target), { recursive: true });
  const text = "# Agency Client\n\nInspect this as data.\n";
  await writeFile(target, text, "utf8");

  const result = await auditBody(root, record());

  assert.equal(result.status, "inspected");
  assert.equal(result.present, true);
  assert.equal(result.bodySha256, sha256(text));
  assert.equal(result.byteSize, Buffer.byteLength(text));
  assert.equal(result.lineCount, 4);
  assert.equal(result.resolvedRelativePath, "repo\\skill-a\\SKILL.md");
  assert.deepEqual(result.structure.headings, ["Agency Client"]);
  assert.equal(result.structure.frontmatterName, null);
});

test("body audit extracts bounded frontmatter and heading structure", async (context) => {
  const root = await temporary(context);
  const target = path.join(root, "repo", "skill-a", "SKILL.md");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(
    target,
    [
      "---",
      "name: agency-client",
      "description: Coordinate client onboarding and reporting.",
      "---",
      "# Operating workflow",
      "## Intake",
      "## Delivery",
      "",
    ].join("\n"),
    "utf8",
  );

  const result = await auditBody(root, record());

  assert.equal(result.structure.frontmatterName, "agency-client");
  assert.equal(
    result.structure.frontmatterDescription,
    "Coordinate client onboarding and reporting.",
  );
  assert.deepEqual(result.structure.headings, ["Operating workflow", "Intake", "Delivery"]);
});

test("body audit extracts at most eight unique command-shaped lines as inert data", async (context) => {
  const root = await temporary(context);
  const target = path.join(root, "repo", "skill-a", "SKILL.md");
  await mkdir(path.dirname(target), { recursive: true });
  const commands = Array.from({ length: 10 }, (_, index) => `/agency:command-${index}`);
  await writeFile(
    target,
    ["# Agency commands", ...commands, commands[0], "ordinary explanatory prose", ""].join("\n"),
    "utf8",
  );

  const result = await auditBody(root, record());

  assert.equal(result.structure.invocationCandidates.length, 8);
  assert.deepEqual(result.structure.invocationCandidates[0], {
    evidenceType: "inspected-source-data",
    text: "/agency:command-0",
  });
  assert.equal(result.structure.invocationCandidates.at(-1).text, "/agency:command-7");
});

test("body audit preserves missing files as explicit evidence", async (context) => {
  const root = await temporary(context);
  const result = await auditBody(root, record());

  assert.deepEqual(
    {
      status: result.status,
      present: result.present,
      bodySha256: result.bodySha256,
      errorCode: result.errorCode,
    },
    { status: "missing", present: false, bodySha256: null, errorCode: "ENOENT" },
  );
});

test("body audit rejects lexical and real-path escape", async (context) => {
  const parent = await temporary(context);
  const root = path.join(parent, "warehouse");
  await mkdir(root);
  await writeFile(path.join(parent, "outside.md"), "outside", "utf8");

  await assert.rejects(
    auditBody(root, record({ sourcePath: "..\\outside.md" })),
    /escapes canonical warehouse root/,
  );
});

test("corpus coverage build is byte-stable and reconciles exact inputs", async (context) => {
  const root = await temporary(context);
  const warehouse = path.join(root, "warehouse");
  const output = path.join(root, "output");
  const sourceRecordsPath = path.join(root, "source-records.jsonl");
  const ontologyPath = path.join(root, "ontology.json");
  const provenancePath = path.join(root, "provenance.jsonl");
  const duplicateGroupsPath = path.join(root, "duplicates.json");
  const reviewsPath = path.join(root, "reviews");
  const clustersPath = path.join(root, "clusters");
  const target = path.join(warehouse, "repo", "skill-a", "SKILL.md");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, "# Agency Client\n", "utf8");
  await writeFile(sourceRecordsPath, `${JSON.stringify(record())}\n`, "utf8");
  await writeFile(
    ontologyPath,
    `${JSON.stringify({
      schemaVersion: 1,
      version: "test",
      families: [
        { id: "agency-client-services", keywords: ["agency client"] },
      ],
    })}\n`,
    "utf8",
  );
  await mkdir(reviewsPath);
  const reviewBatch = {
    schemaVersion: 1,
    waveId: "agency-client-services-wave-001",
    familyId: "agency-client-services",
    reviewer: "test-reviewer",
    reviewMethod: "bounded-source-review-v1",
    reviews: [
      {
        sourceId: "skill-a",
        bodySha256: sha256("# Agency Client\n"),
        neutralCapabilitySummary: "Reconcile an authorized client intake into a bounded account contract.",
        neutralIntentExamples: [
          "reconcile authorized client evidence into a bounded account contract",
        ],
        legacyAliases: [],
        inputs: ["client evidence"],
        operations: ["reconcile evidence"],
        outputs: ["account contract"],
        effects: ["read"],
        failureBehavior: ["defer on missing authority"],
        exclusions: ["external communication"],
        usefulInvariants: ["authority remains explicit"],
        materialRisks: ["stale evidence"],
        disposition: "independent-implementation",
        proposedCluster: "client-intake",
        confidence: "high",
        copiedSourceProse: false,
        promotionClaim: false,
      },
    ],
  };
  await writeFile(
    path.join(reviewsPath, "wave-001.json"),
    `${JSON.stringify(reviewBatch)}\n`,
    "utf8",
  );
  const [normalizedReview] = validateReviewBatch(
    reviewBatch,
    [record()],
    [{
      schemaVersion: 1,
      sourceId: "skill-a",
      status: "inspected",
      present: true,
      bodySha256: sha256("# Agency Client\n"),
      byteSize: Buffer.byteLength("# Agency Client\n"),
      lineCount: 2,
    }],
  );
  await mkdir(clustersPath);
  await writeFile(
    path.join(clustersPath, "agency.json"),
    `${JSON.stringify({
      schemaVersion: 1,
      clusterSetId: "agency-client-services-clusters-v1",
      familyId: "agency-client-services",
      clusters: [{
        id: "client-intake",
        intent: "Reconcile authorized client intake evidence.",
        relationship: "canonical-with-variants",
        synthesisDecision: "candidate",
        rationale: "The reviewed source defines one bounded intake operation.",
        members: [{
          sourceId: "skill-a",
          reviewDigest: normalizedReview.reviewDigest,
          role: "canonical",
        }],
      }],
    })}\n`,
    "utf8",
  );
  await writeFile(provenancePath, "", "utf8");
  await writeFile(
    duplicateGroupsPath,
    `${JSON.stringify({ schemaVersion: 1, exact: [], aliases: [], candidates: [] })}\n`,
    "utf8",
  );

  const options = {
    warehouseRoot: warehouse,
    sourceRecordsPath,
    ontologyPath,
    provenancePath,
    duplicateGroupsPath,
    reviewsPath,
    clustersPath,
    outputPath: output,
  };
  const first = await buildCorpusCoverage(options);
  const firstFiles = await Promise.all(
    ["body-evidence.jsonl", "coverage-ledger.jsonl", "coverage-summary.json", "cluster-evidence.jsonl", "candidate-evidence.jsonl"].map(
      (name) => readFile(path.join(output, name), "utf8"),
    ),
  );
  const second = await buildCorpusCoverage(options);
  const secondFiles = await Promise.all(
    ["body-evidence.jsonl", "coverage-ledger.jsonl", "coverage-summary.json", "cluster-evidence.jsonl", "candidate-evidence.jsonl"].map(
      (name) => readFile(path.join(output, name), "utf8"),
    ),
  );

  assert.equal(first.sourceCount, 1);
  assert.equal(first.evidenceCounts.bodyInspected, 1);
  assert.equal(first.evidenceCounts.cardReviewed, 1);
  assert.equal(first.evidenceCounts.clustered, 1);
  assert.match(first.artifactDigests.clusterEvidenceSha256, /^[0-9a-f]{64}$/);
  assert.equal(first.artifactDigests.candidateEvidenceSha256, sha256("\n"));
  assert.equal(first.reviewQueues["agency-client-services"].sourceCount, 1);
  assert.equal(first.reviewQueues["agency-client-services"].packetCount, 1);
  const queue = JSON.parse(
    await readFile(
      path.join(output, "families", "agency-client-services", "queue.json"),
      "utf8",
    ),
  );
  const packet = JSON.parse(
    await readFile(
      path.join(output, "families", "agency-client-services", "packets", "001.json"),
      "utf8",
    ),
  );
  assert.equal(queue.cards.length, 1);
  assert.equal(packet.cards.length, 1);
  assert.deepEqual(first, second);
  assert.deepEqual(firstFiles, secondFiles);
});
