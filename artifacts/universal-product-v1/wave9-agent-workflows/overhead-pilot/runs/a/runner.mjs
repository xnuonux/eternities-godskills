// Dependency-aware check runner.

function isNonBlankString(value) {
  // Blankness may look at surrounding whitespace, but identity never does:
  // IDs are stored and compared exactly as given.
  return typeof value === 'string' && value.trim() !== '';
}

function fail(message) {
  throw new TypeError(message);
}

// Validates the full declared catalog and returns private snapshots so later
// execution cannot be affected by input mutation or property getters.
function buildCatalog(checks) {
  if (!Array.isArray(checks)) fail('checks must be an array');

  const nodes = new Map();
  const orderedIds = [];

  for (let i = 0; i < checks.length; i++) {
    if (!Object.hasOwn(checks, i)) fail(`checks[${i}] is missing`);
    const check = checks[i];
    if (check === null || typeof check !== 'object') {
      fail(`checks[${i}] must be a record`);
    }

    const id = check.id;
    const requires = check.requires;
    if (!isNonBlankString(id)) {
      fail(`checks[${i}].id must be a nonblank string`);
    }
    if (!Array.isArray(requires)) {
      fail(`check ${JSON.stringify(id)} requires must be an array`);
    }

    const dependencies = [];
    for (let j = 0; j < requires.length; j++) {
      if (!Object.hasOwn(requires, j)) {
        fail(`check ${JSON.stringify(id)} has a hole in requires`);
      }
      const dependency = requires[j];
      if (!isNonBlankString(dependency)) {
        fail(`check ${JSON.stringify(id)} needs a nonblank string dependency`);
      }
      dependencies.push(dependency);
    }

    if (nodes.has(id)) fail(`duplicate check id ${JSON.stringify(id)}`);
    nodes.set(id, { id, requires: dependencies });
    orderedIds.push(id);
  }

  // The entire catalog is checked, including checks no target reaches.
  for (const id of orderedIds) {
    for (const dependency of nodes.get(id).requires) {
      if (!nodes.has(dependency)) {
        fail(`check ${JSON.stringify(id)} requires unknown check ${JSON.stringify(dependency)}`);
      }
    }
  }

  // Depth-first cycle detection over every declared check.
  const done = new Set();
  const inProgress = new Set();
  for (const start of orderedIds) {
    if (done.has(start)) continue;
    inProgress.add(start);
    const stack = [[start, 0]];
    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      const node = nodes.get(frame[0]);
      if (frame[1] < node.requires.length) {
        const dependency = node.requires[frame[1]++];
        if (inProgress.has(dependency)) {
          fail(`dependency cycle involving ${JSON.stringify(dependency)}`);
        }
        if (!done.has(dependency)) {
          inProgress.add(dependency);
          stack.push([dependency, 0]);
        }
      } else {
        stack.pop();
        inProgress.delete(frame[0]);
        done.add(frame[0]);
      }
    }
  }

  return nodes;
}

export async function runChecks(checks, targets, execute) {
  if (typeof execute !== 'function') fail('execute must be a function');
  const nodes = buildCatalog(checks);

  if (!Array.isArray(targets)) fail('targets must be an array');
  const selectedTargets = [];
  for (let i = 0; i < targets.length; i++) {
    if (!Object.hasOwn(targets, i)) fail(`targets[${i}] is missing`);
    const target = targets[i];
    if (!isNonBlankString(target)) fail(`targets[${i}] must be a nonblank string`);
    if (!nodes.has(target)) fail(`unknown target ${JSON.stringify(target)}`);
    selectedTargets.push(target);
  }

  // Depth first over targets in input order and dependencies in declaration
  // order, emitting each distinct reachable check after its prerequisites.
  const order = [];
  const seen = new Set();
  for (const target of selectedTargets) {
    if (seen.has(target)) continue;
    seen.add(target);
    const stack = [[target, 0]];
    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      const node = nodes.get(frame[0]);
      if (frame[1] < node.requires.length) {
        const dependency = node.requires[frame[1]++];
        if (!seen.has(dependency)) {
          seen.add(dependency);
          stack.push([dependency, 0]);
        }
      } else {
        stack.pop();
        order.push(frame[0]);
      }
    }
  }

  const results = [];
  const statusById = new Map();
  for (const id of order) {
    const node = nodes.get(id);

    // A check runs only when every immediate prerequisite passed.
    const blockedBy = [];
    const alreadyListed = new Set();
    let isBlocked = false;
    for (const dependency of node.requires) {
      if (statusById.get(dependency) === 'passed') continue;
      isBlocked = true;
      if (!alreadyListed.has(dependency)) {
        alreadyListed.add(dependency);
        blockedBy.push(dependency);
      }
    }
    if (isBlocked) {
      statusById.set(id, 'blocked');
      results.push({ id, status: 'blocked', blockedBy });
      continue;
    }

    try {
      await execute(id);
    } catch (reason) {
      statusById.set(id, 'failed');
      const error = reason instanceof Error ? reason.message : String(reason);
      results.push({ id, status: 'failed', error });
      continue;
    }
    statusById.set(id, 'passed');
    results.push({ id, status: 'passed' });
  }

  return results;
}
