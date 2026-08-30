import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { buildWaveThreeEvidence } from "../scripts/build-quarry-wave-3-evidence.mjs";
import { sha256 } from "../src/io.mjs";

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "eternities-wave3-evidence-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const skillDirectory = path.join(root, "quarry", "skill-one");
  const body = "---\nname: one\ndescription: inspect supplied local evidence\n---\n\n# one\n\nread the exact input and report evidence.\n";
  await mkdir(skillDirectory, { recursive: true });
  await writeFile(path.join(skillDirectory, "SKILL.md"), body, "utf8");
  await mkdir(path.join(root, "artifacts", "github-wave-3"), { recursive: true });
  await writeFile(
    path.join(root, "artifacts", "github-wave-3", "source-records.jsonl"),
    `${JSON.stringify({
      schemaVersion: 1,
      id: `fixture/repo@${"a".repeat(40)}:SKILL.md`,
      repository: "fixture/repo",
      head: "a".repeat(40),
      sourcePath: "SKILL.md",
      sourceAbsolutePath: path.join(skillDirectory, "SKILL.md"),
      bodyBytes: Buffer.byteLength(body),
      bodySha256: sha256(body),
      licenseSignal: "MIT",
      disposition: "acquire",
      inert: true,
    })}\n`,
    "utf8",
  );
  return { root, skillDirectory };
}

test("wave three evidence covers every source and canonical body", async (t) => {
  const { root } = await fixture(t);
  const result = await buildWaveThreeEvidence({ root });

  assert.equal(result.security.totalSources, 1);
  assert.equal(result.structures.sourceCount, 1);
  assert.equal(result.structures.canonicalBodyCount, 1);
  assert.equal(result.receipt.status, "verified");
  assert.equal(result.receipt.thirdPartyCodeExecuted, false);
  assert.equal(result.receipt.sourceInstructionsActivated, false);
  assert.match(result.receipt.outputs.securityLedger.sha256, /^[a-f0-9]{64}$/);
  assert.match(result.receipt.outputs.bodyStructures.sha256, /^[a-f0-9]{64}$/);
});

test("wave three evidence fails closed when source bytes drift", async (t) => {
  const { root, skillDirectory } = await fixture(t);
  await writeFile(path.join(skillDirectory, "SKILL.md"), "changed\n", "utf8");

  await assert.rejects(
    () => buildWaveThreeEvidence({ root }),
    /body digest mismatch/,
  );
  await assert.rejects(
    () => readFile(path.join(root, "receipts", "github-wave-3-structural-evidence.json")),
    /ENOENT/,
  );
});
