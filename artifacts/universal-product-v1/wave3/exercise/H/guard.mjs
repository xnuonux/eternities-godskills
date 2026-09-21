const IDENTITY_KEYS = [
  'data',
  'split',
  'preprocess',
  'code',
  'architecture',
  'environment',
];

const CACHE_REQUIRED_DEPENDENCIES = ['data', 'split', 'preprocess', 'code'];
const STATE_KEYS = ['model', 'optimizer', 'scheduler', 'rng', 'sampler', 'scaler'];
const OPERATIONS = ['cache', 'resume', 'warm-start'];
const ARTIFACT_KINDS = ['cache', 'checkpoint'];

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isIdentityString(value) {
  return typeof value === 'string' && value.length > 0;
}

function hasDuplicates(values) {
  return new Set(values).size !== values.length;
}

function validateStringArray(value, label) {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string') || hasDuplicates(value)) {
    return `${label} is missing or malformed`;
  }
  return null;
}

function validateIdentityFields(value, label) {
  if (!isRecord(value)) {
    return `${label} is missing or malformed`;
  }

  for (const key of Object.keys(value)) {
    if (!IDENTITY_KEYS.includes(key) || !isIdentityString(value[key])) {
      return `${label} contains malformed identity data`;
    }
  }
  return null;
}

function validateRequest(request) {
  if (!isRecord(request)) {
    return ['request is missing or malformed'];
  }
  if (!OPERATIONS.includes(request.operation)) {
    return ['operation is unsupported'];
  }

  const identityError = validateIdentityFields(request.identity, 'request identity');
  if (identityError) {
    return [identityError];
  }
  for (const key of IDENTITY_KEYS) {
    if (!hasOwn(request.identity, key)) {
      return [`request identity is missing: ${key}`];
    }
  }

  const requiredStateError = validateStringArray(request.requiredState, 'requiredState');
  if (requiredStateError) {
    return [requiredStateError];
  }
  for (const stateKey of request.requiredState) {
    if (!STATE_KEYS.includes(stateKey)) {
      return [`requiredState contains unsupported state: ${stateKey}`];
    }
  }

  const evaluationError = validateStringArray(request.evaluationIds, 'evaluationIds');
  if (evaluationError) {
    return [evaluationError];
  }
  return null;
}

function validateArtifactBasics(artifact, expectedKind) {
  if (!isRecord(artifact)) {
    return ['artifact is missing or malformed'];
  }
  if (!ARTIFACT_KINDS.includes(artifact.kind)) {
    return ['artifact kind is unsupported'];
  }
  if (artifact.kind !== expectedKind) {
    return [`artifact kind is incompatible with ${expectedKind}`];
  }
  if (artifact.status !== 'complete') {
    return ['artifact is not complete'];
  }
  if (artifact.verified !== true) {
    return ['artifact is not verified'];
  }

  const identityError = validateIdentityFields(artifact.identity, 'artifact identity');
  if (identityError) {
    return [identityError];
  }
  return null;
}

function validateCacheDependencies(artifact) {
  const dependencies = artifact.dependsOn;
  if (!Array.isArray(dependencies) || dependencies.length === 0 || hasDuplicates(dependencies)) {
    return ['cache dependency declarations are missing or malformed'];
  }
  for (const dependency of dependencies) {
    if (!IDENTITY_KEYS.includes(dependency)) {
      return [`cache dependency is unsupported: ${String(dependency)}`];
    }
    if (!hasOwn(artifact.identity, dependency) || !isIdentityString(artifact.identity[dependency])) {
      return [`cache dependency identity is missing: ${dependency}`];
    }
  }
  for (const required of CACHE_REQUIRED_DEPENDENCIES) {
    if (!dependencies.includes(required)) {
      return [`cache dependency is required: ${required}`];
    }
  }
  return null;
}

function validateStateRecord(artifact) {
  if (!isRecord(artifact.state)) {
    return ['artifact state is missing or malformed'];
  }
  for (const key of Object.keys(artifact.state)) {
    if (!STATE_KEYS.includes(key) || typeof artifact.state[key] !== 'boolean') {
      return ['artifact state is malformed'];
    }
  }
  return null;
}

function validateHoldout(request, artifact) {
  const fitError = validateStringArray(artifact.fitIds, 'fitIds');
  if (fitError) {
    return ['fit membership is unknown or malformed'];
  }

  const evaluationIds = new Set(request.evaluationIds);
  if (artifact.fitIds.some((sampleId) => evaluationIds.has(sampleId))) {
    return ['artifact fit membership overlaps the current holdout'];
  }
  return null;
}

function block(...reasons) {
  return { decision: 'block', reasons };
}

export function assessReuse(request, artifact) {
  const requestErrors = validateRequest(request);
  if (requestErrors) {
    return block(...requestErrors);
  }

  const expectedKind = request.operation === 'cache' ? 'cache' : 'checkpoint';
  const artifactErrors = validateArtifactBasics(artifact, expectedKind);
  if (artifactErrors) {
    return block(...artifactErrors);
  }

  const holdoutError = validateHoldout(request, artifact);
  if (holdoutError) {
    return block(...holdoutError);
  }

  if (request.operation === 'cache') {
    const dependencyError = validateCacheDependencies(artifact);
    if (dependencyError) {
      return block(...dependencyError);
    }

    const changed = artifact.dependsOn.filter(
      (key) => artifact.identity[key] !== request.identity[key],
    );
    if (changed.length > 0) {
      return {
        decision: 'rebuild',
        reasons: [`cache dependency identity changed: ${changed.join(', ')}`],
      };
    }
    return {
      decision: 'reuse',
      reasons: ['verified cache dependencies match and the current holdout is preserved'],
    };
  }

  if (request.operation === 'resume') {
    const stateError = validateStateRecord(artifact);
    if (stateError) {
      return block(...stateError);
    }

    const identityMismatches = IDENTITY_KEYS.filter(
      (key) => !hasOwn(artifact.identity, key) || artifact.identity[key] !== request.identity[key],
    );
    if (identityMismatches.length > 0) {
      return block(`checkpoint identity mismatch: ${identityMismatches.join(', ')}`);
    }

    const missingState = request.requiredState.filter(
      (stateKey) => artifact.state[stateKey] !== true,
    );
    if (missingState.length > 0) {
      return block(`required checkpoint state is unavailable: ${missingState.join(', ')}`);
    }
    return {
      decision: 'resume',
      reasons: ['verified checkpoint identities and required state match'],
    };
  }

  const stateError = validateStateRecord(artifact);
  if (stateError) {
    return block(...stateError);
  }
  if (artifact.identity.architecture !== request.identity.architecture) {
    return block('checkpoint architecture is incompatible with the requested model');
  }
  if (artifact.state.model !== true) {
    return block('verified model weights are unavailable');
  }
  return {
    decision: 'warm-start',
    reasons: ['verified model weights match the architecture and the current holdout is preserved'],
  };
}

