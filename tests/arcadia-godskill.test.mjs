import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { validateCompositionContract } from "../src/composition.mjs";
import { validateCapabilityContract } from "../src/schema.mjs";

const root = new URL("../", import.meta.url);
const skillPath = new URL("../skills/eternities-arcadia/SKILL.md", import.meta.url);
const contractPath = new URL("../skills/eternities-arcadia/references/capability-contract.json", import.meta.url);

function frontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match);
  return Object.fromEntries(match[1].split("\n").map((line) => {
    const at = line.indexOf(":");
    return [line.slice(0, at).trim(), line.slice(at + 1).trim()];
  }));
}

test("Arcadia is a compact agent-neutral game development entrypoint", async () => {
  const markdown = (await readFile(skillPath, "utf8")).replace(/\r\n/g, "\n");
  const meta = frontmatter(markdown);
  assert.equal(meta.name, "eternities-arcadia");
  assert.match(meta.description, /game/i);
  assert.match(meta.description, /do not use/i);
  for (const route of ["game direction", "runtime systems", "player experience", "proof and release"]) {
    assert.match(markdown, new RegExp(route, "i"));
  }
  assert.match(markdown, /human.*verdict/i);
  assert.match(markdown, /do not invoke Arcadia recursively/i);
  assert.ok(Math.ceil(Buffer.byteLength(markdown, "utf8") / 4) <= 4000);
});

test("Arcadia exposes four routes and only the twenty candidate sources", async () => {
  const contract = JSON.parse(await readFile(contractPath, "utf8"));
  assert.doesNotThrow(() => validateCapabilityContract(contract));
  assert.doesNotThrow(() => validateCompositionContract(contract));
  assert.equal(contract.id, "godskill-eternities-arcadia-v1");
  assert.equal(contract.category, "game-design-development");
  assert.equal(contract.explicitOnly, false);
  assert.deepEqual(contract.effects, ["read", "write"]);
  assert.deepEqual(contract.routes.map(({ id }) => id), [
    "game-direction", "runtime-systems", "player-experience", "proof-and-release",
  ]);
  assert.equal(contract.routes.some(({ delegates }) => delegates.includes(contract.name)), false);
  assert.equal(contract.sourceIds.length, 20);
  assert.deepEqual(contract.sourceEvidence.clusters.map(({ id }) => id), [
    "game-direction-contract",
    "game-player-experience",
    "game-proof-and-verdict",
    "game-runtime-systems",
  ]);
  const serialized = JSON.stringify(contract);
  for (const excluded of [
    "skill-b1c5dae2c9f8b4b6",
    "skill-c672de8666610086",
    "skill-4177e7f0e23def3a",
    "skill-db19e91e6f58e8e1",
    "skill-d4446fd83f92f9cc",
  ]) assert.doesNotMatch(serialized, new RegExp(excluded));
});

test("Arcadia mining receipt preserves all reviewed boundaries", async () => {
  const receipt = await readFile(new URL("skills/eternities-arcadia/references/mining-receipt.md", root), "utf8");
  for (const cluster of [
    "game-direction-contract", "game-runtime-systems", "game-player-experience",
    "game-proof-and-verdict", "generated-content-boundary", "game-shipping-boundary",
    "runtime-administration-boundary", "narrow-demo-example",
  ]) assert.match(receipt, new RegExp(cluster));
  assert.match(receipt, /no source prose was copied/i);
  assert.match(receipt, /no third-party code or instruction was executed/i);
});
