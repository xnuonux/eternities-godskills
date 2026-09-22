#!/usr/bin/env node
// Regression check for evaluate.mjs evidence labeling.
// Everything below is test-only: the temporary consumers are synthetic
// fixtures created here (never model consumers) and produce no scored outcomes.

import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const failures = [];

// Passes on the reference; on mutant runs it hits a missing module, which is a
// nonzero normal exit that must NOT be advertised as a confirmed semantic kill.
const MISSING_MODULE_CONSUMER = `// synthetic test-only consumer
import { pathToFileURL } from "node:url";
const target = process.env.TARGET_MODULE;
const { coalesce } = await import(pathToFileURL(target).href);
if (target.includes("mutant-")) await import("missing-module-for-evaluate-regression");
const result = coalesce([{ id: "a", amount: 2 }, { id: "a", amount: 3 }]);
if (result.length !== 1 || result[0].id !== "a" || result[0].amount !== 5) {
  throw new Error("unexpected reference result");
}
`;

// Fails on every target, so the reference fails and the suite is invalid.
const ALWAYS_FAILING_CONSUMER = `// synthetic test-only consumer
process.exit(1);
`;

function expect(condition, message) {
  if (!condition) failures.push(message);
}

function runEvaluator(testsPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, "evaluate.mjs"), testsPath], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "", stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (exitCode) => resolve({ exitCode, stdout, stderr }));
  });
}

function parseReport(run, label) {
  expect(run.exitCode === 0, `${label}: evaluate.mjs should exit 0, got ${run.exitCode}; stderr=${run.stderr.trim()}`);
  try {
    return JSON.parse(run.stdout);
  } catch (error) {
    failures.push(`${label}: evaluate.mjs output is not JSON: ${error.message}`);
    return null;
  }
}

function checkNoConfirmedKillClaims(report, label) {
  expect(!("mutantKillCount" in report), `${label}: report advertises automatic mutantKillCount=${report.mutantKillCount}`);
  const claimed = (report.cases ?? [])
    .filter((c) => "semanticBugCaught" in c)
    .map((c) => `${c.id}=${c.semanticBugCaught}`);
  expect(claimed.length === 0, `${label}: cases advertise automatic semanticBugCaught: ${claimed.join(", ")}`);
  expect(report.confirmedMutantKillCount === null, `${label}: confirmedMutantKillCount must stay null pending review, got ${report.confirmedMutantKillCount}`);
  expect(report.requiresManualFailureReview === true, `${label}: requiresManualFailureReview must be true, got ${report.requiresManualFailureReview}`);
}

function checkRuleClarity(report, label) {
  expect(/reference must pass/i.test(report.referenceRule ?? ""), `${label}: referenceRule must state that the reference must pass: ${report.referenceRule}`);
  const review = report.reviewRule ?? "";
  expect(/inspect/i.test(review) && /assertion/i.test(review) && /contract exception/i.test(review), `${label}: reviewRule must require inspecting each failure's assertion or legitimate contract exception: ${review}`);
  const counting = report.countingRule ?? "";
  expect(/timeout/i.test(counting) && /signal/i.test(counting) && /spawn/i.test(counting) && /non-candidates/i.test(counting), `${label}: countingRule must mark timeout/signal/spawn errors as distinctly non-candidates: ${counting}`);
}

function checkMissingModuleScenario(report, label) {
  checkNoConfirmedKillClaims(report, label);
  checkRuleClarity(report, label);
  expect(report.validTestSuite === true, `${label}: reference should pass (validTestSuite=true), got ${report.validTestSuite}`);
  expect(report.eligibleFailureCandidateCount === 8, `${label}: expected 8 unreviewed failure candidates (no confirmed kills), got ${report.eligibleFailureCandidateCount}`);
  expect(Array.isArray(report.cases) && report.cases.length === 9, `${label}: expected 9 reported cases, got ${report.cases?.length}`);
  const reference = (report.cases ?? []).find((c) => c.id === "reference");
  expect(reference?.outcome === "passed", `${label}: reference case should pass, got ${reference?.outcome}`);
  expect(reference?.failureCandidate === false, `${label}: reference case must not be a failure candidate, got ${reference?.failureCandidate}`);
  for (const c of (report.cases ?? []).filter((c) => c.id !== "reference")) {
    expect(c.outcome === "failed" && c.exitCode !== 0, `${label}: ${c.id} should record a nonzero normal exit, got outcome=${c.outcome} exitCode=${c.exitCode}`);
    expect(c.failureCandidate === true, `${label}: ${c.id} must be an unreviewed failure candidate, got ${c.failureCandidate}`);
    expect(c.timeout === false && c.signal === null && c.spawnError === null, `${label}: ${c.id} must stay distinct from timeout/signal/spawn-error outcomes`);
    expect(/ERR_MODULE_NOT_FOUND|Cannot find/i.test(c.stderr.text), `${label}: ${c.id} must keep failure output for manual review, got stderr=${c.stderr.text}`);
  }
}

function checkAlwaysFailingScenario(report, label) {
  checkNoConfirmedKillClaims(report, label);
  expect(report.validTestSuite === false, `${label}: consumer failing on the reference must be an invalid suite (validTestSuite=false), got ${report.validTestSuite}`);
  expect(report.eligibleFailureCandidateCount === 0, `${label}: failed reference must invalidate the aggregate candidate count (zero eligible candidates), got ${report.eligibleFailureCandidateCount}`);
}

const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "coalesce-evaluate-regression-"));
try {
  const missingPath = path.join(tempDir, "missing-module-consumer.mjs");
  const failingPath = path.join(tempDir, "always-failing-consumer.mjs");
  await fs.writeFile(missingPath, MISSING_MODULE_CONSUMER);
  await fs.writeFile(failingPath, ALWAYS_FAILING_CONSUMER);

  const missingReport = parseReport(await runEvaluator(missingPath), "missing-module scenario");
  if (missingReport) checkMissingModuleScenario(missingReport, "missing-module scenario");

  const failingReport = parseReport(await runEvaluator(failingPath), "always-failing scenario");
  if (failingReport) checkAlwaysFailingScenario(failingReport, "always-failing scenario");
} finally {
  await fs.rm(tempDir, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`regression FAILED (${failures.length} problem${failures.length === 1 ? "" : "s"}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("regression ok: no automatic confirmed-kill claims; normal-exit failures stay unreviewed candidates");
