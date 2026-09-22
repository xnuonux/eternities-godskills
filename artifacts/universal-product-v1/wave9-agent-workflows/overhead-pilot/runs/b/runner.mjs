const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

function isNonblankString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function assertStringArray(value, label) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${label} must be an array`);
  }

  for (let index = 0; index < value.length; index += 1) {
    if (!hasOwn(value, index) || !isNonblankString(value[index])) {
      throw new TypeError(`${label}[${index}] must be a nonblank string`);
    }
  }
}

function validateCatalog(checks, targets) {
  if (!Array.isArray(checks)) {
    throw new TypeError('checks must be an array');
  }
  if (!Array.isArray(targets)) {
    throw new TypeError('targets must be an array');
  }

  const byId = new Map();

  for (let index = 0; index < checks.length; index += 1) {
    if (!hasOwn(checks, index)) {
      throw new TypeError(`checks[${index}] must be a record`);
    }

    const check = checks[index];
    if (check === null || typeof check !== 'object' || Array.isArray(check)) {
      throw new TypeError(`checks[${index}] must be a record`);
    }
    if (!hasOwn(check, 'id') || !isNonblankString(check.id)) {
      throw new TypeError(`checks[${index}].id must be a nonblank string`);
    }
    if (!hasOwn(check, 'requires')) {
      throw new TypeError(`checks[${index}].requires is required`);
    }
    assertStringArray(check.requires, `checks[${index}].requires`);
    if (byId.has(check.id)) {
      throw new TypeError(`duplicate check id: ${check.id}`);
    }
    byId.set(check.id, check);
  }

  for (const check of byId.values()) {
    for (const dependencyId of check.requires) {
      if (!byId.has(dependencyId)) {
        throw new TypeError(`unknown dependency: ${dependencyId}`);
      }
    }
  }

  assertStringArray(targets, 'targets');
  for (const target of targets) {
    if (!byId.has(target)) {
      throw new TypeError(`unknown target: ${target}`);
    }
  }

  const states = new Map();
  const visit = (id) => {
    const state = states.get(id) || 0;
    if (state === 2) {
      return;
    }
    if (state === 1) {
      throw new TypeError(`dependency cycle involving: ${id}`);
    }

    states.set(id, 1);
    for (const dependencyId of byId.get(id).requires) {
      visit(dependencyId);
    }
    states.set(id, 2);
  };

  for (const id of byId.keys()) {
    visit(id);
  }

  return byId;
}

/**
 * Run selected checks and their prerequisites in deterministic dependency-first order.
 *
 * @param {Array<{id: string, requires: string[]}>} checks
 * @param {string[]} targets
 * @param {(id: string) => unknown} execute
 * @returns {Promise<Array<object>>}
 */
export async function runChecks(checks, targets, execute) {
  if (typeof execute !== 'function') {
    throw new TypeError('execute must be a function');
  }

  const byId = validateCatalog(checks, targets);
  const reachable = [];
  const seen = new Set();

  const visit = (id) => {
    if (seen.has(id)) {
      return;
    }
    seen.add(id);

    for (const dependencyId of byId.get(id).requires) {
      visit(dependencyId);
    }
    reachable.push(id);
  };

  for (const target of targets) {
    visit(target);
  }

  const statuses = new Map();
  const results = [];

  for (const id of reachable) {
    const check = byId.get(id);
    const blockedBy = [];

    for (const dependencyId of check.requires) {
      const dependencyResult = statuses.get(dependencyId);
      if (
        dependencyResult.status !== 'passed' &&
        !blockedBy.includes(dependencyId)
      ) {
        blockedBy.push(dependencyId);
      }
    }

    if (blockedBy.length > 0) {
      const result = { id, status: 'blocked', blockedBy };
      statuses.set(id, result);
      results.push(result);
      continue;
    }

    try {
      await execute(id);
      const result = { id, status: 'passed' };
      statuses.set(id, result);
      results.push(result);
    } catch (reason) {
      const result = {
        id,
        status: 'failed',
        error: reason instanceof Error ? reason.message : String(reason),
      };
      statuses.set(id, result);
      results.push(result);
    }
  }

  return results;
}
