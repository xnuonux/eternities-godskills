import assert from "node:assert/strict";
import test from "node:test";

import { sha256 } from "../src/io.mjs";
import {
  buildFirstPartyEvidence,
  classifyArchivePath,
} from "../src/first-party-quarry.mjs";

function record(relativePath, text, state = "working") {
  const bytes = Buffer.from(text, "utf8");
  let reads = 0;
  return {
    relativePath,
    byteSize: bytes.byteLength,
    state,
    read: async () => {
      reads += 1;
      return bytes;
    },
    get reads() {
      return reads;
    },
  };
}

test("archive classification keeps secrets sessions vendors and binaries content-inert", () => {
  assert.deepEqual(classifyArchivePath(".env"), {
    disposition: "excluded",
    reason: "sensitive-local-state",
    inspectContent: false,
  });
  assert.equal(classifyArchivePath("history/session-export.jsonl").reason, "raw-session-or-log");
  assert.equal(classifyArchivePath("_repos/vendor/SKILL.md").reason, "vendor-or-dependency");
  assert.equal(classifyArchivePath("assets/sigil.png").reason, "binary-or-media");
  assert.equal(classifyArchivePath(".claude/skills/diagnostic-playbook.md").inspectContent, true);
});

test("evidence build never reads excluded content and emits bounded structural cards", async () => {
  const secret = record(".claude/settings.local.json", "OPENROUTER_API_KEY=do-not-read");
  const transcript = record("history/claude-session.jsonl", "private transcript");
  const workflow = record(
    ".claude/skills/diagnostic-playbook.md",
    "# Evidence first\n## Measurement before hypothesis\nKeep an append-only eliminated hypothesis ledger.\n" +
      "export function diagnose() {}\n" +
      "x".repeat(8_000),
  );

  const built = await buildFirstPartyEvidence([secret, transcript, workflow], {
    sourceIdentity: "lunari-archive@test",
    maxEvidenceChars: 256,
  });

  assert.equal(secret.reads, 0);
  assert.equal(transcript.reads, 0);
  assert.equal(workflow.reads, 1);
  assert.equal(built.ledger.length, 3);
  assert.equal(built.cards.length, 1);
  assert.deepEqual(built.cards[0].headings, ["Evidence first", "Measurement before hypothesis"]);
  assert.deepEqual(built.cards[0].symbols, ["diagnose"]);
  assert.equal(built.cards[0].ownerRecommendation, "eternities-phoenix");
  assert.equal(Object.hasOwn(built.cards[0], "content"), false);
  assert.ok(built.cards[0].evidenceChars <= 256);
});

test("exact duplicates and existing corpus matches are deterministic and path ordered", async () => {
  const duplicateText = "# Verify the goal\nMap observable truths to exact wiring and live proof.\n";
  const duplicateDigest = sha256(Buffer.from(duplicateText));
  const records = [
    record("z/copy.md", duplicateText),
    record("a/original.md", duplicateText),
    record("m/schema.md", "# Schema first\nInspect information_schema before migration.\n"),
  ];

  const built = await buildFirstPartyEvidence(records, {
    sourceIdentity: "lunari-archive@test",
    corpusDigests: new Set([duplicateDigest]),
    godskillDigestPaths: new Map([[duplicateDigest, ["skills/eternities-forge/SKILL.md"]]]),
  });

  assert.deepEqual(
    built.ledger.map((row) => row.relativePath),
    ["a/original.md", "m/schema.md", "z/copy.md"],
  );
  assert.deepEqual(built.duplicates.internal, [
    {
      sha256: duplicateDigest,
      paths: ["a/original.md", "z/copy.md"],
    },
  ]);
  assert.deepEqual(built.duplicates.corpusMatches, [duplicateDigest]);
  assert.deepEqual(built.duplicates.godskillMatches, [
    {
      sha256: duplicateDigest,
      archivePaths: ["a/original.md", "z/copy.md"],
      godskillPaths: ["skills/eternities-forge/SKILL.md"],
    },
  ]);
});

test("owner recommendations distinguish coordination debugging and schema mechanisms", async () => {
  const built = await buildFirstPartyEvidence(
    [
      record("coordination.md", "# Shared tree\nAcquire a push lease mutex, heartbeat, then handoff ownership."),
      record("debug.md", "# Diagnosis\nReproduce, measure before hypothesis, and record eliminated causes."),
      record("schema.md", "# Migration\nInspect information_schema, constraints, coverage, rollback, and dry run."),
    ],
    { sourceIdentity: "lunari-archive@test" },
  );

  assert.deepEqual(
    built.ownerMap.map(({ relativePath, owner, reviewState }) => ({ relativePath, owner, reviewState })),
    [
      { relativePath: "coordination.md", owner: "eternities-forge", reviewState: "unreviewed-first-party" },
      { relativePath: "debug.md", owner: "eternities-phoenix", reviewState: "unreviewed-first-party" },
      { relativePath: "schema.md", owner: "eternities-atlas", reviewState: "unreviewed-first-party" },
    ],
  );
});
