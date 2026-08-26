import test from "node:test";
import assert from "node:assert/strict";

import {
  selectSmallestRoute,
  validateCompositionContract,
} from "../src/composition.mjs";

function contract(overrides = {}) {
  return {
    schemaVersion: 1,
    name: "eternities-example",
    explicitOnly: false,
    effects: ["read"],
    routes: [
      {
        id: "inspect",
        capabilities: ["inspect"],
        delegates: ["eternities-oracle"],
      },
      {
        id: "inspect-and-design",
        capabilities: ["inspect", "design"],
        delegates: ["eternities-oracle", "brainstorming"],
      },
    ],
    terminationConditions: ["the requested decision is evidenced"],
    ...overrides,
  };
}

test("composition contracts accept bounded non-recursive routes", () => {
  assert.equal(validateCompositionContract(contract()).name, "eternities-example");
});

test("composition contracts reject duplicate route ids", () => {
  const value = contract();
  value.routes[1].id = value.routes[0].id;
  assert.throws(() => validateCompositionContract(value), /duplicate route id/i);
});

test("composition contracts require a termination condition", () => {
  assert.throws(
    () => validateCompositionContract(contract({ terminationConditions: [] })),
    /terminationConditions must not be empty/i,
  );
});

test("composition contracts reject direct recursive delegation", () => {
  const value = contract();
  value.routes[0].delegates.push(value.name);
  assert.throws(() => validateCompositionContract(value), /must not delegate to itself/i);
});

test("smallest route selection is deterministic", () => {
  const value = validateCompositionContract(contract());
  assert.equal(selectSmallestRoute(value.routes, ["inspect"]).id, "inspect");
  assert.equal(
    selectSmallestRoute(value.routes, ["inspect", "design"]).id,
    "inspect-and-design",
  );
});

test("smallest route selection fails closed on uncovered requirements", () => {
  const value = validateCompositionContract(contract());
  assert.throws(
    () => selectSmallestRoute(value.routes, ["publish"]),
    /no route covers required capabilities: publish/i,
  );
});
