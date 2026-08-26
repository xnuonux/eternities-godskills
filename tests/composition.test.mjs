import test from "node:test";
import assert from "node:assert/strict";

import {
  selectSmallestRoute,
  validateCompositionContract,
  validateCompositionGraph,
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

test("composition contracts reject duplicate route capabilities", () => {
  const value = contract();
  value.routes[0].capabilities.push("inspect");
  assert.throws(
    () => validateCompositionContract(value),
    /capabilities must not contain duplicates/i,
  );
});

test("smallest route selection rejects malformed routes", () => {
  assert.throws(
    () => selectSmallestRoute([{ id: "broken" }], ["inspect"]),
    /capabilities must be an array of strings/i,
  );
});

test("composition graph rejects two-node delegation cycles", () => {
  const alpha = contract({
    name: "alpha",
    routes: [{ id: "a", capabilities: ["a"], delegates: ["beta"] }],
  });
  const beta = contract({
    name: "beta",
    routes: [{ id: "b", capabilities: ["b"], delegates: ["alpha"] }],
  });
  assert.throws(() => validateCompositionGraph([alpha, beta]), /alpha -> beta -> alpha/i);
});

test("composition graph rejects longer delegation cycles", () => {
  const alpha = contract({
    name: "alpha",
    routes: [{ id: "a", capabilities: ["a"], delegates: ["beta"] }],
  });
  const beta = contract({
    name: "beta",
    routes: [{ id: "b", capabilities: ["b"], delegates: ["gamma"] }],
  });
  const gamma = contract({
    name: "gamma",
    routes: [{ id: "c", capabilities: ["c"], delegates: ["alpha"] }],
  });
  assert.throws(
    () => validateCompositionGraph([alpha, beta, gamma]),
    /alpha -> beta -> gamma -> alpha/i,
  );
});
