import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { buildRoutingArtifacts } from "../scripts/build-routing-index.mjs";
import {
  buildRoutingIndex,
  shortlistRoutingCards,
} from "../src/routing-index.mjs";

function card(index, overrides = {}) {
  const id = overrides.id ?? `skill-${String(index).padStart(4, "0")}`;
  const family = overrides.family ?? `family-${String(index % 100).padStart(3, "0")}`;
  const capability = overrides.capability ?? `capability-${String(index % 100).padStart(3, "0")}`;
  return {
    schemaVersion: 1,
    id,
    family,
    intent: `provide ${capability} from a compact routing card`,
    successCondition: `${capability} is completed with bounded effects`,
    provides: [capability, "shared-capability"],
    requires: [],
    intentExamples: {
      direct: [`complete ${capability}`],
      paraphrased: [`handle the ${capability} outcome`],
      contextual: [`the current mission now requires ${capability}`],
    },
    negativeIntents: [`skip ${capability} for a routine fact`],
    effects: ["local-read"],
    riskClass: "low",
    authorityRequirements: ["local-read"],
    preconditions: [],
    compatibleWith: [],
    conflictsWith: [],
    contextCost: 100 + index,
    dependencyCost: 1,
    evidenceConfidence: "high",
    entrypoint: `skills/${id}/SKILL.md`,
    legacyAliases: [],
    ...overrides,
  };
}

function request(overrides = {}) {
  return {
    schemaVersion: 1,
    requestId: "request-index-test",
    outcome: "deliver a consequential feature through verified implementation",
    candidateFamilies: ["implementation-engineering"],
    requiredCapabilities: ["implementation", "review", "tests", "verification"],
    forbiddenCapabilities: [],
    permittedEffects: ["local-read", "local-write"],
    availableAuthority: ["local-read", "local-write", "repository-write"],
    availablePreconditions: ["repository-present", "settled-outcome"],
    maximumRisk: "moderate",
    minimumEvidenceConfidence: "medium",
    contextBudget: 4000,
    maxCompositionSize: 3,
    unresolvedDecisions: [],
    ...overrides,
  };
}

function forgeCard() {
  return card(0, {
    id: "eternities-forge",
    family: "implementation-engineering",
    capability: "implementation",
    provides: ["implementation", "integration", "review", "tests", "verification"],
    effects: ["local-read", "local-write"],
    riskClass: "moderate",
    authorityRequirements: ["local-read", "local-write", "repository-write"],
    preconditions: ["repository-present", "settled-outcome"],
    contextCost: 998,
    dependencyCost: 8,
    evidenceConfidence: "verified",
  });
}

test("cold retrieval bounds a 5000-card catalog while retaining full coverage", () => {
  const cards = Array.from({ length: 4999 }, (_, index) => card(index + 1));
  cards.push(forgeCard());
  const index = buildRoutingIndex(cards);

  const shortlist = shortlistRoutingCards(index, request(), { limit: 32 });

  assert.equal(index.cardCount, 5000);
  assert.equal(index.familyMap.length, 101);
  assert.ok(shortlist.length <= 32);
  assert.ok(shortlist.some(({ id }) => id === "eternities-forge"));
  assert.equal(JSON.stringify(index).includes("full skill body"), false);
});

test("family and capability indexes contain exact stable card identities", () => {
  const index = buildRoutingIndex([
    card(2, { family: "beta", capability: "inspect" }),
    card(1, { family: "alpha", capability: "design" }),
    forgeCard(),
  ]);

  assert.deepEqual(index.familyMap.map(({ id }) => id), [
    "alpha",
    "beta",
    "implementation-engineering",
  ]);
  assert.deepEqual(index.capabilityIndex.implementation, ["eternities-forge"]);
  assert.deepEqual(Object.keys(index.cardsById), [
    "eternities-forge",
    "skill-0001",
    "skill-0002",
  ]);
});

test("bounded retrieval falls back to capability evidence for an unknown family", () => {
  const index = buildRoutingIndex([forgeCard(), card(4)]);
  const shortlist = shortlistRoutingCards(
    index,
    request({ candidateFamilies: ["unknown-family"] }),
    { limit: 32 },
  );

  assert.deepEqual(shortlist.map(({ id }) => id), ["eternities-forge"]);
});

test("bounded retrieval rejects duplicate identities and invalid limits", () => {
  assert.throws(
    () => buildRoutingIndex([forgeCard(), forgeCard()]),
    /duplicate routing card id: eternities-forge/,
  );
  const index = buildRoutingIndex([forgeCard()]);
  assert.throws(
    () => shortlistRoutingCards(index, request(), { limit: 0 }),
    /limit must be an integer from 1 to 32/,
  );
  assert.throws(
    () => shortlistRoutingCards(index, request(), { limit: 33 }),
    /limit must be an integer from 1 to 32/,
  );
});

test("bounded retrieval is independent of source order", () => {
  const cards = [forgeCard(), card(7), card(8)];
  const forward = shortlistRoutingCards(buildRoutingIndex(cards), request(), { limit: 32 });
  const reverse = shortlistRoutingCards(
    buildRoutingIndex([...cards].reverse()),
    request(),
    { limit: 32 },
  );

  assert.deepEqual(reverse, forward);
});

async function writeCard(skillsRoot, value) {
  const destination = path.join(skillsRoot, value.id, "references");
  await mkdir(destination, { recursive: true });
  await writeFile(
    path.join(destination, "routing-card.json"),
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );
}

test("routing artifact builds are byte-stable and hash exact compact cards", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "eternities-routing-index-"));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const skillsRoot = path.join(temporary, "skills");
  const outputPath = path.join(temporary, "artifacts");
  await Promise.all([writeCard(skillsRoot, forgeCard()), writeCard(skillsRoot, card(9))]);

  const first = await buildRoutingArtifacts({ skillsRoot, outputPath });
  const firstFiles = await Promise.all(
    ["family-map.json", "cards.jsonl", "manifest.json"].map((name) =>
      readFile(path.join(outputPath, name), "utf8"),
    ),
  );
  const second = await buildRoutingArtifacts({ skillsRoot, outputPath });
  const secondFiles = await Promise.all(
    ["family-map.json", "cards.jsonl", "manifest.json"].map((name) =>
      readFile(path.join(outputPath, name), "utf8"),
    ),
  );

  assert.deepEqual(second, first);
  assert.deepEqual(secondFiles, firstFiles);
  assert.equal(first.cardCount, 2);
  assert.equal(first.familyCount, 2);
  assert.match(first.cardsSha256, /^[0-9a-f]{64}$/);
  assert.match(first.familyMapSha256, /^[0-9a-f]{64}$/);
});

test("routing card JSONL is ordered by stable card id, not serialized field values", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "eternities-routing-order-"));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const skillsRoot = path.join(temporary, "skills");
  const outputPath = path.join(temporary, "artifacts");
  await Promise.all([
    writeCard(skillsRoot, card(1, { id: "a-card", authorityRequirements: ["z-authority"] })),
    writeCard(skillsRoot, card(2, { id: "z-card", authorityRequirements: ["a-authority"] })),
  ]);

  await buildRoutingArtifacts({ skillsRoot, outputPath });
  const ids = (await readFile(path.join(outputPath, "cards.jsonl"), "utf8"))
    .trim()
    .split(/\r?\n/)
    .map((line) => JSON.parse(line).id);

  assert.deepEqual(ids, ["a-card", "z-card"]);
});
