import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateCapabilityContract } from "../src/schema.mjs";

const root = new URL("../", import.meta.url);
const json = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));

test("Hermes is a compact agent-neutral six-route contract", async () => {
  const markdown = await readFile(new URL("../skills/eternities-hermes/SKILL.md", import.meta.url), "utf8");
  const contract = await json("skills/eternities-hermes/references/capability-contract.json");
  assert.doesNotThrow(() => validateCapabilityContract(contract));
  assert.equal(contract.name, "eternities-hermes");
  assert.deepEqual(contract.routes.map(({ id }) => id), [
    "batch-file-workflow", "browser-automation", "browser-use-integration",
    "java-mcp-server-generation", "omni-cli-tool-integration", "remote-test-coordination",
  ]);
  assert.equal(contract.routes.some(({ delegates }) => delegates.includes(contract.name)), false);
  assert.match(markdown, /fail closed/i);
  assert.ok(Math.ceil(Buffer.byteLength(markdown, "utf8") / 4) <= 2600);
});
