import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { compileRequestFile } from "../scripts/intent.mjs";

const repositoryRoot = path.resolve(new URL("../", import.meta.url).pathname.slice(1));

async function fixture(context) {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "eternities-intent-cli-"));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const request = {
    schemaVersion: 1,
    requestId: "intent-cli-feature",
    text: "coordinate implementation tests review verification and integration for the settled release",
    context: {
      permittedEffects: ["local-read", "local-write"],
      availableAuthority: ["local-read", "local-write", "repository-write"],
      availablePreconditions: ["repository-present", "settled-outcome"],
      forbiddenCapabilities: [],
      maximumRisk: "moderate",
      minimumEvidenceConfidence: "verified",
      contextBudget: 4000,
      maxCompositionSize: 3,
    },
  };
  const requestPath = path.join(temporary, "natural-request.json");
  await writeFile(requestPath, `${JSON.stringify(request, null, 2)}\n`, "utf8");
  return {
    temporary,
    requestPath,
    cardsPath: path.join(repositoryRoot, "artifacts", "routing", "cards.jsonl"),
  };
}

test("file transport compiles and routes without reading a selected skill body", async (context) => {
  const { requestPath, cardsPath, temporary } = await fixture(context);
  const absentBody = path.join(temporary, "skills", "eternities-forge", "SKILL.md");
  await assert.rejects(() => access(absentBody), /ENOENT/);
  const result = await compileRequestFile({ requestPath, cardsPath });
  assert.deepEqual(result.routeReceipt.selectedIds, ["eternities-forge"]);
  await assert.rejects(() => access(absentBody), /ENOENT/);
});

test("file transport writes byte-stable canonical results", async (context) => {
  const { requestPath, cardsPath, temporary } = await fixture(context);
  const outputPath = path.join(temporary, "intent-result.json");
  const first = await compileRequestFile({ requestPath, cardsPath, outputPath });
  const firstText = await readFile(outputPath, "utf8");
  const second = await compileRequestFile({ requestPath, cardsPath, outputPath });
  const secondText = await readFile(outputPath, "utf8");
  assert.deepEqual(second, first);
  assert.equal(secondText, firstText);
  assert.equal(firstText, `${JSON.stringify(first, null, 2)}\n`);
});

test("intent command rejects unknown and apply-style flags", () => {
  for (const flag of ["--unknown", "--apply", "--execute"]) {
    const result = spawnSync(process.execPath, ["scripts/intent.mjs", flag], {
      cwd: repositoryRoot,
      encoding: "utf8",
      windowsHide: true,
    });
    assert.notEqual(result.status, 0);
    assert.match(`${result.stderr}${result.stdout}`, /unknown argument/);
  }
});
