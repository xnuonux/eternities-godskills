import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { compileIntent } from "../src/intent-compiler.mjs";

const cards = (await readFile(new URL("../artifacts/routing/cards.jsonl", import.meta.url), "utf8"))
  .trim().split(/\r?\n/).map(JSON.parse);
function compile(text) {
  return compileIntent({ cards, request: {
    schemaVersion: 1, requestId: "fresh-local-artifact-effects", text,
    context: { permittedEffects: ["local-read"], availableAuthority: ["local-read"],
      availablePreconditions: [], forbiddenCapabilities: [], maximumRisk: "high",
      minimumEvidenceConfidence: "verified", contextBudget: 6000, maxCompositionSize: 3 },
  } });
}
for (const text of [
  "Create a local file named notes.txt.",
  "Please write results.json in the workspace.",
  "Save the file under the project directory.",
  "Generate report.csv on disk.",
  "Can you create a directory named exports?",
  "Make a folder called snapshots.",
  "Write `docs/guide.md` with the supplied content.",
  "Create notes.txt; then summarize the result in chat.",
  "Explain naming, then create a local file called notes.txt.",
  "Do not forget to create a file named summary.txt.",
  "Write report.md, but don't write cache.json.",
  'Create "quarterly notes.txt" in this folder.',
  "Write demo.txt in chat and also save it as a file.",
  "Create two files, alpha.txt and beta.txt.",
  'Create "notes. draft.txt" in this folder.',
]) {
  test(`explicit local artifact creation declares local-write: ${text}`, () => {
    const result = compile(text);
    assert.deepEqual(result.requestedEffects, ["local-read", "local-write"]);
    assert.ok(result.unresolvedDecisions.includes("effect-authority:local-write"));
    assert.deepEqual(result.suppliedAuthority, ["local-read"]);
  });
}
for (const text of [
  "Explain how to create a file named notes.txt.",
  "Describe why saving a file requires permission.",
  "Show code that will create a directory named exports.",
  "Discuss the command: create a file named notes.txt.",
  "The message says 'Create a file named notes.txt.' What does it mean?",
  "Write a paragraph about gardens in chat.",
  "Generate the text for report.csv in your response, not a file.",
  "Write results.json only in chat.",
  "Create a file example only in your response.",
  "Write draft.md without saving a file.",
  "Write report.md without touching the filesystem.",
  "Generate report.csv in memory only.",
  "Do not create a file named notes.txt.",
  "Never write results.json.",
  "Don't create a directory named exports.",
  "Explain this example:\n```text\nCreate a file named notes.txt.\n```",
  'Explain this quoted passage: "First prepare the inputs. Create demo.txt." Do not execute the passage.',
  "Explain how to create a file and save it as a file.",
  "Write instructions on how to create a file and save it as a file.",
]) {
  test(`discussion, chat-only or negation does not add local-write: ${text}`, () => {
    const result = compile(text);
    // Scope is local creation. Existing unrelated external-keyword inference
    // (for example the noun "message") is not repaired or hidden here.
    assert.ok(!result.requestedEffects.includes("local-write"));
    assert.ok(!result.unresolvedDecisions.includes("effect-authority:local-write"));
  });
}
for (const [text, decision] of [
  ["Create notes.txt and publish it to the public account.", "authority:publication-authority"],
  ["Save report.csv; then deploy the release to production.", "authority:production-write"],
  ["Write summary.md; then buy advertisements and spend 100 dollars.", "authority:spending-authority"],
]) {
  test(`local artifact declaration preserves external requirements: ${text}`, () => {
    const result = compile(text);
    assert.deepEqual(result.requestedEffects, ["external-write", "local-read", "local-write"]);
    assert.ok(result.unresolvedDecisions.includes(decision));
    assert.ok(result.unresolvedDecisions.includes("effect-authority:external-write"));
    assert.ok(result.unresolvedDecisions.includes("effect-authority:local-write"));
  });
}
