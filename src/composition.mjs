const EFFECTS = new Set(["none", "read", "write", "external-write"]);

function object(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
}

function nonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string`);
  }
}

function stringArray(value, label, { nonEmpty = true } = {}) {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new Error(`${label} must be an array of strings`);
  }
  if (nonEmpty && value.length === 0) {
    throw new Error(`${label} must not be empty`);
  }
  if (new Set(value).size !== value.length) {
    throw new Error(`${label} must not contain duplicates`);
  }
}

function validateRoute(route, label, ownerName = null) {
  object(route, label);
  nonEmptyString(route.id, `${label}.id`);
  stringArray(route.capabilities, `${label}.capabilities`);
  stringArray(route.delegates, `${label}.delegates`, { nonEmpty: false });
  if (ownerName && route.delegates.includes(ownerName)) {
    throw new Error(`${label} must not delegate to itself`);
  }
  return route;
}

export function validateCompositionContract(value) {
  object(value, "compositionContract");
  if (value.schemaVersion !== 1) {
    throw new Error("compositionContract.schemaVersion must be 1");
  }
  nonEmptyString(value.name, "compositionContract.name");
  if (typeof value.explicitOnly !== "boolean") {
    throw new Error("compositionContract.explicitOnly must be boolean");
  }
  stringArray(value.effects, "compositionContract.effects");
  for (const effect of value.effects) {
    if (!EFFECTS.has(effect)) {
      throw new Error(`compositionContract.effects contains invalid value: ${effect}`);
    }
  }
  stringArray(
    value.terminationConditions,
    "compositionContract.terminationConditions",
  );
  if (!Array.isArray(value.routes) || value.routes.length === 0) {
    throw new Error("compositionContract.routes must not be empty");
  }

  const routeIds = new Set();
  for (const [index, route] of value.routes.entries()) {
    const label = `compositionContract.routes[${index}]`;
    validateRoute(route, label, value.name);
    if (routeIds.has(route.id)) throw new Error(`duplicate route id: ${route.id}`);
    routeIds.add(route.id);
  }
  return value;
}

export function selectSmallestRoute(routes, requiredCapabilities) {
  stringArray(requiredCapabilities, "requiredCapabilities");
  if (!Array.isArray(routes) || routes.length === 0) {
    throw new Error("routes must not be empty");
  }
  routes.forEach((route, index) => validateRoute(route, `routes[${index}]`));
  const required = new Set(requiredCapabilities);
  const matches = routes
    .filter((route) => {
      const available = new Set(route.capabilities);
      return [...required].every((capability) => available.has(capability));
    })
    .sort(
      (left, right) =>
        left.capabilities.length - right.capabilities.length ||
        left.id.localeCompare(right.id),
    );
  if (matches.length === 0) {
    throw new Error(
      `no route covers required capabilities: ${[...required].sort().join(", ")}`,
    );
  }
  return matches[0];
}

export function validateCompositionGraph(contracts) {
  if (!Array.isArray(contracts) || contracts.length === 0) {
    throw new Error("composition graph must contain contracts");
  }
  contracts.forEach(validateCompositionContract);
  const byName = new Map();
  for (const contract of contracts) {
    if (byName.has(contract.name)) {
      throw new Error(`duplicate composition contract: ${contract.name}`);
    }
    byName.set(contract.name, contract);
  }
  const edges = new Map(
    contracts.map((contract) => [
      contract.name,
      [...new Set(contract.routes.flatMap(({ delegates }) => delegates))]
        .filter((name) => byName.has(name))
        .sort(),
    ]),
  );
  const visiting = new Set();
  const visited = new Set();
  const stack = [];

  function visit(name) {
    if (visiting.has(name)) {
      const start = stack.indexOf(name);
      throw new Error(`composition cycle: ${[...stack.slice(start), name].join(" -> ")}`);
    }
    if (visited.has(name)) return;
    visiting.add(name);
    stack.push(name);
    for (const next of edges.get(name) ?? []) visit(next);
    stack.pop();
    visiting.delete(name);
    visited.add(name);
  }

  for (const name of [...byName.keys()].sort()) visit(name);
  return contracts;
}
