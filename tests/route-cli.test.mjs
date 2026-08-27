import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { buildRoutingArtifacts } from "../scripts/build-routing-index.mjs";
import { routeRequest } from "../scripts/route.mjs";

const repositoryRoot = path.resolve(new URL("../", import.meta.url).pathname.slice(1));

async function fixture(context) {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "eternities-route-cli-"));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const skillsRoot = path.join(temporary, "skills");
  const artifactRoot = path.join(temporary, "routing");
  const card = JSON.parse(
    await readFile(
      path.join(
        repositoryRoot,
        "skills",
        "eternities-forge",
        "references",
        "routing-card.json",
      ),
      "utf8",
    ),
  );
  const cardDirectory = path.join(skillsRoot, card.id, "references");
  await mkdir(cardDirectory, { recursive: true });
  await writeFile(
    path.join(cardDirectory, "routing-card.json"),
    `${JSON.stringify(card, null, 2)}\n`,
    "utf8",
  );
  await buildRoutingArtifacts({ skillsRoot, outputPath: artifactRoot });

  const request = {
    schemaVersion: 1,
    requestId: "request-cli-feature",
    outcome: "deliver a consequential feature with tests, review, and proof",
    candidateFamilies: ["implementation-engineering"],
    requiredCapabilities: ["implementation", "review", "tests", "verification"],
    forbiddenCapabilities: [],
    permittedEffects: ["local-read", "local-write"],
    availableAuthority: ["local-read", "local-write", "repository-write"],
    availablePreconditions: ["repository-present", "settled-outcome"],
    maximumRisk: "moderate",
    minimumEvidenceConfidence: "verified",
    contextBudget: 4000,
    maxCompositionSize: 3,
    unresolvedDecisions: [],
  };
  const requestPath = path.join(temporary, "request.json");
  await writeFile(requestPath, `${JSON.stringify(request, null, 2)}\n`, "utf8");
  return {
    temporary,
    artifactRoot,
    requestPath,
    cardsPath: path.join(artifactRoot, "cards.jsonl"),
  };
}

test("file transport routes from compact artifacts without loading the selected body", async (context) => {
  const { requestPath, cardsPath, temporary } = await fixture(context);
  const absentBody = path.join(
    temporary,
    "skills",
    "eternities-forge",
    "SKILL.md",
  );
  await assert.rejects(() => access(absentBody), /ENOENT/);

  const receipt = await routeRequest({ requestPath, cardsPath });

  assert.equal(receipt.status, "selected");
  assert.deepEqual(receipt.selectedIds, ["eternities-forge"]);
  await assert.rejects(() => access(absentBody), /ENOENT/);
});

test("output mode writes canonical deterministic route receipts", async (context) => {
  const { requestPath, cardsPath, temporary } = await fixture(context);
  const outputPath = path.join(temporary, "receipt.json");

  const first = await routeRequest({ requestPath, cardsPath, outputPath });
  const firstText = await readFile(outputPath, "utf8");
  const second = await routeRequest({ requestPath, cardsPath, outputPath });
  const secondText = await readFile(outputPath, "utf8");

  assert.deepEqual(second, first);
  assert.equal(secondText, firstText);
  assert.equal(firstText, `${JSON.stringify(first, null, 2)}\n`);
});

test("transport verifies the family map against compact card evidence", async (context) => {
  const { requestPath, cardsPath, artifactRoot } = await fixture(context);
  const familyMapPath = path.join(artifactRoot, "family-map.json");
  const familyMap = JSON.parse(await readFile(familyMapPath, "utf8"));
  familyMap.cardCount = 2;
  await writeFile(familyMapPath, `${JSON.stringify(familyMap, null, 2)}\n`, "utf8");

  await assert.rejects(
    () => routeRequest({ requestPath, cardsPath }),
    /family map does not reconcile with compact cards/,
  );
});

test("command line rejects unknown and apply-style flags", () => {
  for (const flag of ["--unknown", "--apply"]) {
    const result = spawnSync(process.execPath, ["scripts/route.mjs", flag], {
      cwd: repositoryRoot,
      encoding: "utf8",
      windowsHide: true,
    });
    assert.notEqual(result.status, 0);
    assert.match(`${result.stderr}${result.stdout}`, /unknown argument/);
  }
});
