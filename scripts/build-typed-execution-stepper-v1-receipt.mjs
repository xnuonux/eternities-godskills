import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { sha256 } from "../src/io.mjs";
import { buildDeterministicTypedExecutionStepperFixture } from "../tests/helpers/typed-execution-stepper-fixture.mjs";
import {
  canonicalJson,
  logicalDigest,
} from "../tests/helpers/typed-composition-fixture.mjs";
import {
  assertCommit,
  gitText,
  headCommit,
  manifestAtCommit,
  moduleClosureAtCommit,
  requireCleanExcept,
  reviewedDiffAtCommit,
  resolveSourceCommit,
  runTests,
  valueDigest,
} from "./lib/source-certification.mjs";

export { buildDeterministicTypedExecutionStepperFixture };

const certificationId = "typed-execution-stepper-v1";
const protocolId = "eternities-typed-execution-stepper-certification-v1";
const fixturePath = "fixtures/typed-execution-stepper-v1.json";
const receiptPath = "receipts/typed-execution-stepper-v1.json";
const certificationPath = "docs/typed-execution-stepper-v1-certification.md";
const reviewPath = "docs/typed-execution-stepper-v1-terra-review.json";
const specificationPath = "docs/superpowers/specs/2026-08-31-typed-execution-stepper-v1-design.md";
const planPath = "docs/superpowers/plans/2026-08-31-typed-execution-stepper-v1.md";
const parentPath = "receipts/typed-composition-v1.json";
const sourceRoots = Object.freeze([
  "scripts/build-typed-execution-stepper-v1-receipt.mjs",
  "src/typed-execution-stepper.mjs",
].sort());
const declaredFiles = Object.freeze([
  "README.md",
  "package.json",
  fixturePath,
  planPath,
  reviewPath,
  specificationPath,
].sort());
const testFiles = Object.freeze([
  "tests/helpers/typed-execution-stepper-fixture.mjs",
  "tests/typed-composition-receipt.test.mjs",
  "tests/typed-composition.test.mjs",
  "tests/typed-execution-stepper-receipt.test.mjs",
  "tests/typed-execution-stepper.test.mjs",
].sort());
const focusedTestFiles = Object.freeze([
  "tests/typed-composition-receipt.test.mjs",
  "tests/typed-composition.test.mjs",
  "tests/typed-execution-stepper.test.mjs",
]);
const releaseOnlyPaths = Object.freeze([certificationPath, receiptPath]);
const expectedFixtureDigest = "f514832922c2a7bf9c941f1dbbeb5a257c52cd8558e49b6a283731a5812578df";
const expectedParentReceiptDigest = "da81b62ead231bdd89fd449e8a17d444685c92ad272a02a20a28e26e0563bc6a";
const DIGEST = /^[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const proofLimits = Object.freeze([
  "certified-capability-canaries-only",
  "provider-neutral-step-validation-not-output-persistence",
  "no-external-executor-terminal-reconciliation-or-deduplication",
  "no-exactly-once-external-effects",
  "no-live-model-skill-or-provider-quality",
  "no-hostile-same-user-operating-system-isolation",
  "no-authority-provider-credential-realm-continuity-evolution-lunari-inspiration-or-soul",
  "no-godagents-or-default-host-adoption",
]);

function clone(value) {
  return structuredClone(value);
}

function same(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value;
}

function exactKeys(value, expected, label) {
  object(value, label);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new Error(`${label} fields are invalid`);
  }
}

function requireDigest(value, label) {
  if (!DIGEST.test(value ?? "")) throw new Error(`${label} digest is invalid`);
}

function verifyTestRun(value, label) {
  exactKeys(value, ["status", "tests"], label);
  if (value.status !== "pass" || !Number.isInteger(value.tests) || value.tests < 1) {
    throw new Error(`${label} is invalid`);
  }
  return value;
}

function verifyManifest(value, paths, label) {
  exactKeys(value, ["paths", "entries", "digest"], label);
  if (!same(value.paths, paths) || !Array.isArray(value.entries)
      || !same(value.entries.map(({ path: relativePath }) => relativePath), paths)) {
    throw new Error(`${label} paths are invalid`);
  }
  for (const row of value.entries) {
    exactKeys(row, ["path", "sha256", "bytes"], `${label} entry`);
    requireDigest(row.sha256, `${label} entry`);
    if (!Number.isInteger(row.bytes) || row.bytes < 1) throw new Error(`${label} byte count is invalid`);
  }
  requireDigest(value.digest, label);
  if (value.digest !== valueDigest(value.entries)) throw new Error(`${label} digest mismatch`);
  return value;
}

function verifyReview(value) {
  exactKeys(value, [
    "schemaVersion", "protocolId", "reviewerModel", "reviewMode", "reviewedParentCommit",
    "reviewedDiffSha256", "reviewedPaths", "unresolvedCriticalDefects",
    "unresolvedImportantDefects", "disposition", "notes",
  ], "typed execution stepper review");
  if (value.schemaVersion !== 1
      || value.protocolId !== "eternities-independent-source-review-v1"
      || value.reviewerModel !== "terra"
      || value.reviewMode !== "independent"
      || value.disposition !== "approved"
      || value.unresolvedCriticalDefects !== 0
      || value.unresolvedImportantDefects !== 0
      || !Array.isArray(value.reviewedPaths) || value.reviewedPaths.length < 1
      || !Array.isArray(value.notes)) {
    throw new Error("typed execution stepper independent review is invalid");
  }
  if (!COMMIT.test(value.reviewedParentCommit)) {
    throw new Error("typed execution stepper reviewed parent commit is invalid");
  }
  requireDigest(value.reviewedDiffSha256, "typed execution stepper reviewed diff");
  return value;
}

export function verifyTypedExecutionStepperFixture(value) {
  exactKeys(value, [
    "schemaVersion", "protocolId", "parent", "execution", "steps", "validation",
    "completion", "disclosure", "fixtureDigest",
  ], "typed execution stepper fixture");
  if (value.schemaVersion !== 1
      || value.protocolId !== "eternities-typed-execution-stepper-fixture-v1"
      || value.parent.receiptDigest !== expectedParentReceiptDigest
      || value.parent.methodDigest !== "63b0a268841992c55953415b279f8e76277a80b0152f49260b3a22db9a75e3c2"
      || value.parent.executionDigest !== "dce249713684b029ffae62bb8b4b8e55b2d394a7b4a49f3ddbb846421e914bf7") {
    throw new Error("typed execution stepper fixture parent is invalid");
  }
  if (value.execution.protocolId !== "eternities-typed-mission-execution-stepper-v1"
      || value.execution.missionId !== "canary:muse-to-forge:v1"
      || value.execution.authorityExpanded !== false
      || !Array.isArray(value.steps) || value.steps.length !== 2
      || !same(value.steps.map(({ capabilityId }) => capabilityId), ["eternities-muse", "eternities-forge"])
      || !same(value.steps.map(({ order }) => order), [0, 1])) {
    throw new Error("typed execution stepper sequence is invalid");
  }
  for (const step of value.steps) {
    if (step.protocolId !== "eternities-typed-mission-execution-step-v1"
        || step.status !== "ready" || step.authorityExpanded !== false) {
      throw new Error("typed execution step is invalid");
    }
    for (const name of [
      "methodDigest", "missionInputDigest", "activationDecisionDigest", "inputDigest", "stepDigest",
    ]) requireDigest(step[name], `typed execution step ${name}`);
  }
  if (!same(value.validation, {
    invalidOutputCode: "output-invalid",
    invalidOutputDidNotAdvance: true,
    freshReplayMuseDigestMatched: true,
    freshReplayForgeDigestMatched: true,
    externalExecutionsAfterRecovery: { "eternities-muse": 0, "eternities-forge": 1 },
  })) throw new Error("typed execution stepper validation evidence is invalid");
  if (!same(value.completion, {
    completionDigest: "ced937d65ee7ebcb2e30db2828105be98608c0b6f9bd946e579d33e969d46191",
    executionDigest: "dce249713684b029ffae62bb8b4b8e55b2d394a7b4a49f3ddbb846421e914bf7",
    referenceParity: true,
    recoveryParity: true,
    nodeExecutions: 2,
    handoffs: 6,
    authorityExpanded: false,
  }) || !same(value.disclosure, {
    methodBodiesEmbedded: 0,
    sourceBodiesTransported: 0,
    bodyMarkerMatches: 0,
  })) throw new Error("typed execution stepper completion evidence is invalid");
  const { fixtureDigest, ...unsigned } = value;
  requireDigest(fixtureDigest, "typed execution stepper fixture");
  if (fixtureDigest !== logicalDigest(unsigned) || fixtureDigest !== expectedFixtureDigest) {
    throw new Error("typed execution stepper fixture digest mismatch");
  }
  return value;
}

function verifySourceClosure(value) {
  exactKeys(value, ["roots", "modules", "digest", "complete"], "typed execution source closure");
  if (!same(value.roots, sourceRoots) || value.complete !== true || !Array.isArray(value.modules)) {
    throw new Error("typed execution source closure is invalid");
  }
  for (const row of value.modules) {
    exactKeys(row, ["path", "sha256", "bytes"], "typed execution source module");
    requireDigest(row.sha256, "typed execution source module");
    if (!Number.isInteger(row.bytes) || row.bytes < 1) throw new Error("typed execution source module bytes are invalid");
  }
  if (!value.modules.some(({ path: relativePath }) => relativePath === "src/typed-execution-stepper.mjs")
      || !value.modules.some(({ path: relativePath }) => relativePath === "src/typed-composition.mjs")
      || !value.modules.some(({ path: relativePath }) => relativePath === "scripts/lib/source-certification.mjs")) {
    throw new Error("typed execution source closure is incomplete");
  }
  requireDigest(value.digest, "typed execution source closure");
  if (value.digest !== valueDigest(value.modules)) throw new Error("typed execution source closure digest mismatch");
  return value;
}

export function verifyTypedExecutionStepperReceipt(value) {
  exactKeys(value, [
    "schemaVersion", "certificationId", "status", "protocolId", "source", "parent",
    "fixture", "requirements", "metrics", "proofLimits", "testRuns", "review", "receiptDigest",
  ], "typed execution stepper receipt");
  if (value.schemaVersion !== 1 || value.certificationId !== certificationId
      || value.status !== "certified" || value.protocolId !== protocolId) {
    throw new Error("typed execution stepper receipt identity is invalid");
  }
  exactKeys(value.source, ["commit", "closure", "declaredManifest", "testManifest"], "typed execution source");
  if (!COMMIT.test(value.source.commit)) throw new Error("typed execution source commit is invalid");
  verifySourceClosure(value.source.closure);
  verifyManifest(value.source.declaredManifest, declaredFiles, "typed execution declared manifest");
  verifyManifest(value.source.testManifest, testFiles, "typed execution test manifest");
  exactKeys(value.parent, ["path", "fileSha256", "receiptDigest"], "typed execution parent");
  if (value.parent.path !== parentPath || value.parent.receiptDigest !== expectedParentReceiptDigest) {
    throw new Error("typed execution parent binding is invalid");
  }
  requireDigest(value.parent.fileSha256, "typed execution parent file");
  exactKeys(value.fixture, ["path", "fileSha256", "logicalDigest", "value"], "typed execution fixture");
  const fixture = verifyTypedExecutionStepperFixture(value.fixture.value);
  if (value.fixture.path !== fixturePath || value.fixture.logicalDigest !== fixture.fixtureDigest
      || value.fixture.fileSha256 !== sha256(`${canonicalJson(fixture)}`)) {
    throw new Error("typed execution fixture binding is invalid");
  }
  if (!same(value.requirements, requirements())) {
    throw new Error("typed execution requirements are invalid");
  }
  if (!same(value.metrics, {
    nodes: 2,
    handoffs: 6,
    acceptedReplayPrefix: 1,
    externalExecutionsAfterRecovery: 1,
    invalidOutputsCommitted: 0,
    methodBodiesEmbedded: 0,
    authorityExpansions: 0,
  })) throw new Error("typed execution metrics are invalid");
  if (!same(value.proofLimits, proofLimits)) throw new Error("typed execution proof limits changed");
  exactKeys(value.testRuns, ["focused", "full"], "typed execution test runs");
  verifyTestRun(value.testRuns.focused, "typed execution focused tests");
  verifyTestRun(value.testRuns.full, "typed execution full tests");
  exactKeys(value.review, ["path", "fileSha256", "value"], "typed execution review binding");
  if (value.review.path !== reviewPath || value.review.fileSha256 !== sha256(`${canonicalJson(value.review.value)}`)) {
    throw new Error("typed execution review binding is invalid");
  }
  verifyReview(value.review.value);
  const { receiptDigest, ...unsigned } = value;
  requireDigest(receiptDigest, "typed execution receipt");
  if (receiptDigest !== valueDigest(unsigned)) throw new Error("typed execution receipt digest mismatch");
  return value;
}

function requirements() {
  return [
    "historical typed-composition bytes remain unchanged",
    "one private-provenance execution handle binds method and mission inputs",
    "only one topological typed step is ready at a time",
    "node output is validated before private execution state advances",
    "invalid output leaves the same current step",
    "forged cloned stale and cross-execution steps fail closed",
    "fresh execution revalidates a persisted output prefix",
    "recovery resumes at the first uncommitted node",
    "completion equals the historical execution output and receipt",
    "no body authority effect provider credential host or default path is added",
  ].map((evidence, index) => ({
    id: `TES-${String(index + 1).padStart(3, "0")}`,
    status: "pass",
    evidence: [evidence],
  }));
}

export async function rebuildTypedExecutionStepperReceipt({
  repositoryRoot,
  sourceCommit,
  testRuns,
} = {}) {
  await assertCommit(repositoryRoot, sourceCommit);
  verifyTestRun(testRuns?.focused, "typed execution focused tests");
  verifyTestRun(testRuns?.full, "typed execution full tests");
  const fixtureText = await gitText(repositoryRoot, sourceCommit, fixturePath);
  const fixture = verifyTypedExecutionStepperFixture(JSON.parse(fixtureText));
  if (fixtureText !== canonicalJson(fixture)) throw new Error("typed execution fixture is not canonical");
  const parentText = await gitText(repositoryRoot, sourceCommit, parentPath);
  const parent = JSON.parse(parentText);
  const { receiptDigest: parentDigest, ...unsignedParent } = parent;
  if (parentText !== canonicalJson(parent)
      || parentDigest !== expectedParentReceiptDigest
      || parentDigest !== sha256(canonicalJson(unsignedParent))) {
    throw new Error("typed execution parent receipt changed");
  }
  const reviewText = await gitText(repositoryRoot, sourceCommit, reviewPath);
  const review = verifyReview(JSON.parse(reviewText));
  if (reviewText !== canonicalJson(review)) throw new Error("typed execution review is not canonical");
  const reviewed = await reviewedDiffAtCommit(repositoryRoot, sourceCommit, {
    excludedPaths: [reviewPath],
  });
  if (review.reviewedParentCommit !== reviewed.parentCommit
      || review.reviewedDiffSha256 !== reviewed.reviewedDiffSha256
      || !same(review.reviewedPaths, reviewed.reviewedPaths)) {
    throw new Error("typed execution independent review does not bind the exact source diff");
  }
  const modules = await moduleClosureAtCommit(repositoryRoot, sourceCommit, sourceRoots);
  const unsigned = {
    schemaVersion: 1,
    certificationId,
    status: "certified",
    protocolId,
    source: {
      commit: sourceCommit,
      closure: {
        roots: [...sourceRoots],
        modules: clone(modules),
        digest: valueDigest(modules),
        complete: true,
      },
      declaredManifest: await manifestAtCommit(repositoryRoot, sourceCommit, declaredFiles),
      testManifest: await manifestAtCommit(repositoryRoot, sourceCommit, testFiles),
    },
    parent: {
      path: parentPath,
      fileSha256: sha256(parentText),
      receiptDigest: parent.receiptDigest,
    },
    fixture: {
      path: fixturePath,
      fileSha256: sha256(fixtureText),
      logicalDigest: fixture.fixtureDigest,
      value: clone(fixture),
    },
    requirements: requirements(),
    metrics: {
      nodes: fixture.completion.nodeExecutions,
      handoffs: fixture.completion.handoffs,
      acceptedReplayPrefix: 1,
      externalExecutionsAfterRecovery: Object.values(
        fixture.validation.externalExecutionsAfterRecovery,
      ).reduce((sum, count) => sum + count, 0),
      invalidOutputsCommitted: 0,
      methodBodiesEmbedded: fixture.disclosure.methodBodiesEmbedded,
      authorityExpansions: fixture.completion.authorityExpanded ? 1 : 0,
    },
    proofLimits: [...proofLimits],
    testRuns: clone(testRuns),
    review: {
      path: reviewPath,
      fileSha256: sha256(reviewText),
      value: clone(review),
    },
  };
  return Object.freeze(verifyTypedExecutionStepperReceipt({
    ...unsigned,
    receiptDigest: valueDigest(unsigned),
  }));
}

async function writeCertification(destination, receipt, release) {
  const lines = [
    "# typed execution stepper v1 certification",
    "",
    `source commit: \`${receipt.source.commit}\``,
    "",
    `receipt digest: \`${receipt.receiptDigest}\``,
    "",
    `fixture digest: \`${receipt.fixture.logicalDigest}\``,
    "",
    `focused tests: ${receipt.testRuns.focused.tests}`,
    "",
    `full tests: ${receipt.testRuns.full.tests}`,
    "",
    `release tests: ${release.tests}`,
    "",
    "the additive stepper exposes one private-provenance typed node at a time, validates output before advancement, revalidates accepted output prefixes after reconstruction, and reproduces the historical typed-composition execution receipt.",
    "",
    "proof remains limited to the boundaries declared in the receipt.",
    "",
  ];
  await writeFile(destination, lines.join("\n"), "utf8");
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const fixtureOutput = path.join(root, ...fixturePath.split("/"));
  const receiptOutput = path.join(root, ...receiptPath.split("/"));
  if (process.argv.includes("--write-fixture")) {
    const fixture = verifyTypedExecutionStepperFixture(
      await buildDeterministicTypedExecutionStepperFixture(),
    );
    await mkdir(path.dirname(fixtureOutput), { recursive: true });
    await writeFile(fixtureOutput, canonicalJson(fixture), "utf8");
    process.stdout.write(`${JSON.stringify({
      status: "written",
      destination: fixtureOutput,
      fixtureDigest: fixture.fixtureDigest,
    })}\n`);
    return;
  }
  await requireCleanExcept(root, releaseOnlyPaths);
  const head = await headCommit(root);
  const sourceCommit = await resolveSourceCommit({
    root,
    head,
    receiptPath: receiptOutput,
    releaseOnlyPaths,
  });
  const liveFixture = await buildDeterministicTypedExecutionStepperFixture();
  const committedFixture = JSON.parse(await gitText(root, sourceCommit, fixturePath));
  if (!same(liveFixture, committedFixture)) throw new Error("live typed execution fixture changed");
  const focused = await runTests(focusedTestFiles, root);
  const preliminary = await rebuildTypedExecutionStepperReceipt({
    repositoryRoot: root,
    sourceCommit,
    testRuns: { focused, full: { status: "pass", tests: focused.tests } },
  });
  await writeFile(receiptOutput, canonicalJson(preliminary), "utf8");
  const full = await runTests([], root);
  const receipt = await rebuildTypedExecutionStepperReceipt({
    repositoryRoot: root,
    sourceCommit,
    testRuns: { focused, full },
  });
  await writeFile(receiptOutput, canonicalJson(receipt), "utf8");
  const release = await runTests(["tests/typed-execution-stepper-receipt.test.mjs"], root);
  await writeCertification(
    path.join(root, ...certificationPath.split("/")),
    receipt,
    release,
  );
  process.stdout.write(`${JSON.stringify({
    status: receipt.status,
    sourceCommit,
    receiptDigest: receipt.receiptDigest,
    fixtureDigest: receipt.fixture.logicalDigest,
    testRuns: receipt.testRuns,
    release,
  })}\n`);
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invoked) {
  main().catch((error) => {
    process.stderr.write(`typed execution stepper certification failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}
