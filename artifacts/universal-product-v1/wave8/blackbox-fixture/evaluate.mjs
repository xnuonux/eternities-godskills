import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const timeoutMs = 5000;
const outputLimit = 2048;
const testsArg = process.argv[2];
if (!testsArg) {
  console.error("usage: node evaluate.mjs <tests.mjs>");
  process.exit(2);
}
const testsPath = path.resolve(testsArg);
const targets = [
  { id: "reference", file: "reference.mjs" },
  ...Array.from({ length: 8 }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    return { id: `mutant-${n}`, file: `variants/mutant-${n}.mjs` };
  }),
];

function runCase(target) {
  const started = Date.now();
  return new Promise((resolve) => {
    let out = "", err = "", outChars = 0, errChars = 0, timedOut = false, spawnError = null;
    const child = spawn(process.execPath, [testsPath], {
      env: { ...process.env, TARGET_MODULE: path.join(root, target.file) },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const collect = (which) => (chunk) => {
      const text = chunk.toString("utf8");
      if (which === "out") { outChars += text.length; out = (out + text).slice(0, outputLimit); }
      else { errChars += text.length; err = (err + text).slice(0, outputLimit); }
    };
    child.stdout.on("data", collect("out"));
    child.stderr.on("data", collect("err"));
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, timeoutMs);
    child.on("error", (error) => { spawnError = String(error?.message ?? error); });
    child.on("close", (exitCode, signal) => {
      clearTimeout(timer);
      const outcome = spawnError ? "spawn-error" : timedOut ? "timeout" : signal ? "signal" : exitCode === 0 ? "passed" : "failed";
      resolve({
        id: target.id,
        outcome,
        exitCode,
        signal: signal ?? null,
        timeout: timedOut,
        spawnError,
        durationMs: Date.now() - started,
        stdout: { text: out, truncated: outChars > outputLimit },
        stderr: { text: err, truncated: errChars > outputLimit },
        failureCandidate: outcome === "failed", // nonzero normal exit only; unreviewed, never an automatic kill
      });
    });
  });
}

const cases = [];
for (const target of targets) cases.push(await runCase(target));
const reference = cases[0];
const validTestSuite = reference.outcome === "passed";
const rawFailureCandidates = cases.slice(1).filter((c) => c.failureCandidate).length;
process.stdout.write(JSON.stringify({
  fixture: "coalesce-blackbox-v1",
  testsPath,
  timeoutMs,
  outputLimit,
  validTestSuite,
  mutantCount: cases.length - 1,
  eligibleFailureCandidateCount: validTestSuite ? rawFailureCandidates : 0,
  confirmedMutantKillCount: null,
  requiresManualFailureReview: true,
  referenceRule: "The reference must pass before any failure candidate is eligible; a failed reference invalidates the aggregate candidate count (reported as 0).",
  reviewRule: "Failure candidates are unreviewed normal-exit failures, not confirmed semantic kills. The parent must inspect each candidate's assertion failure or legitimate contract exception before claiming a caught mutant; broad output heuristics cannot certify a kill.",
  countingRule: "Only a nonzero normal exit is a failure candidate. Timeout, signal, and spawn errors are distinctly non-candidates.",
  cases,
}, null, 2) + "\n");
