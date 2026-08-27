import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateCompositionContract } from "../src/composition.mjs";
import { validateCapabilityContract } from "../src/schema.mjs";

const root = new URL("../", import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));

test("Prometheus is a compact agent-neutral product-operations entrypoint", async () => {
  const markdown = (await readFile(new URL("skills/eternities-prometheus/SKILL.md", root), "utf8")).replace(/\r\n/g, "\n");
  assert.match(markdown, /^---\nname: eternities-prometheus/m);
  assert.match(markdown, /references\/operating-contract\.md/);
  for (const route of ["growth routing", "commercial analytics", "customer insight", "early-adopter research", "learning design", "operational planning", "project-delivery routing"]) assert.match(markdown, new RegExp(route, "i"));
  for (const boundary of ["outreach", "commitments", "pricing changes", "procurement", "account actions", "private-data acquisition", "external writes", "fail closed"]) assert.match(markdown, new RegExp(boundary, "i"));
  assert.ok(Math.ceil(Buffer.byteLength(markdown, "utf8") / 4) <= 4000);
});

test("Prometheus contract exposes exactly seven routes and exact source evidence", async () => {
  const contract = await readJson("skills/eternities-prometheus/references/capability-contract.json");
  assert.doesNotThrow(() => validateCapabilityContract(contract));
  assert.doesNotThrow(() => validateCompositionContract(contract));
  assert.deepEqual(contract.routes.map(({ id }) => id), [
    "growth-routing", "commercial-analytics", "customer-insight", "early-adopter-research", "learning-design", "operational-planning", "project-delivery-routing",
  ]);
  assert.equal(contract.sourceEvidence.mode, "cluster-review-v1");
  assert.equal(contract.sourceEvidence.clusterSetId, "product-operations-clusters-v1");
  assert.equal(contract.sourceIds.length, 22);
  assert.equal(contract.sourceEvidence.clusters.length, 7);
  assert.equal(new Set(contract.sourceIds).size, contract.sourceIds.length);
  assert.equal(contract.routes.some(({ delegates }) => delegates.includes(contract.name)), false);
  assert.match(JSON.stringify(contract), /missing authority|fail closed/i);
});
