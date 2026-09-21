const ID_KEYS = ['data', 'split', 'preprocess', 'code', 'architecture', 'environment'];
const CACHE_REQUIRED_KEYS = ['data', 'split', 'preprocess', 'code'];
const STATE_KEYS = ['model', 'optimizer', 'scheduler', 'rng', 'sampler', 'scaler'];

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isOpaqueId(value) {
  return typeof value === 'string' && value.length > 0 && value.trim().length > 0;
}

function blocked(...reasons) {
  const usefulReasons = reasons.filter(Boolean);
  return {
    decision: 'block',
    reasons: usefulReasons.length > 0 ? usefulReasons : ['reuse evidence is unsafe or incomplete'],
  };
}

function artifactProblems(artifact, expectedKind) {
  if (!isRecord(artifact)) return ['artifact manifest is missing or malformed'];

  const reasons = [];
  if (artifact.kind !== expectedKind) {
    reasons.push(`artifact kind must be ${expectedKind}`);
  }
  if (artifact.status !== 'complete') {
    reasons.push('artifact is not complete');
  }
  if (artifact.verified !== true) {
    reasons.push('artifact bytes are not verified');
  }
  return reasons;
}

function identityProblems(identity, keys, label) {
  if (!isRecord(identity)) return [`${label} identity is missing or malformed`];

  const invalidKeys = keys.filter((key) => !hasOwn(identity, key) || !isOpaqueId(identity[key]));
  return invalidKeys.length > 0
    ? [`${label} identity is missing or malformed: ${invalidKeys.join(', ')}`]
    : [];
}

function idListProblems(ids, label) {
  if (!Array.isArray(ids)) return [`${label} declaration is missing or malformed`];

  const seen = new Set();
  for (const id of ids) {
    if (!isOpaqueId(id)) return [`${label} declaration contains a malformed sample id`];
    if (seen.has(id)) return [`${label} declaration contains duplicate sample ids`];
    seen.add(id);
  }
  return [];
}

function holdoutProblems(request, artifact) {
  const evaluationProblems = idListProblems(request?.evaluationIds, 'evaluationIds');
  const fitProblems = idListProblems(artifact?.fitIds, 'fitIds');
  if (evaluationProblems.length > 0 || fitProblems.length > 0) {
    return [...evaluationProblems, ...fitProblems];
  }

  const evaluationIds = new Set(request.evaluationIds);
  const overlap = artifact.fitIds.filter((id) => evaluationIds.has(id));
  return overlap.length > 0
    ? [`fit/holdout overlap detected: ${overlap.join(', ')}`]
    : [];
}

function dependencyProblems(dependsOn) {
  if (!Array.isArray(dependsOn)) return ['cache dependency declaration is missing or malformed'];

  const seen = new Set();
  for (const dependency of dependsOn) {
    if (!ID_KEYS.includes(dependency)) {
      return [`cache dependency is unsupported: ${String(dependency)}`];
    }
    if (seen.has(dependency)) {
      return [`cache dependency is duplicated: ${dependency}`];
    }
    seen.add(dependency);
  }

  const missing = CACHE_REQUIRED_KEYS.filter((key) => !seen.has(key));
  return missing.length > 0
    ? [`cache dependency declaration is missing: ${missing.join(', ')}`]
    : [];
}

function requiredStateProblems(request, artifact) {
  if (!Array.isArray(request.requiredState)) {
    return ['requiredState declaration is missing or malformed'];
  }

  const seen = new Set();
  for (const stateName of request.requiredState) {
    if (!STATE_KEYS.includes(stateName)) {
      return [`required state is unsupported: ${String(stateName)}`];
    }
    if (seen.has(stateName)) {
      return [`required state is duplicated: ${stateName}`];
    }
    seen.add(stateName);
  }

  if (!seen.has('model')) return ['resume requires model state'];
  if (!isRecord(artifact?.state)) return ['checkpoint state is missing or malformed'];

  const missing = request.requiredState.filter((stateName) => artifact.state[stateName] !== true);
  return missing.length > 0
    ? [`required checkpoint state is unavailable: ${missing.join(', ')}`]
    : [];
}

function mismatchedKeys(requestIdentity, artifactIdentity, keys) {
  return keys.filter((key) => requestIdentity[key] !== artifactIdentity[key]);
}

function assessCache(request, artifact) {
  const reasons = artifactProblems(artifact, 'cache');
  const dependencyIssues = dependencyProblems(artifact?.dependsOn);
  const dependencyKeys = Array.isArray(artifact?.dependsOn) ? artifact.dependsOn : [];
  reasons.push(...dependencyIssues);
  reasons.push(...identityProblems(request?.identity, dependencyKeys, 'request'));
  reasons.push(...identityProblems(artifact?.identity, dependencyKeys, 'artifact'));
  reasons.push(...holdoutProblems(request, artifact));
  if (reasons.length > 0) return blocked(...reasons);

  const changed = mismatchedKeys(request.identity, artifact.identity, dependencyKeys);
  if (changed.length > 0) {
    return {
      decision: 'rebuild',
      reasons: [`cache dependency identity changed: ${changed.join(', ')}`],
    };
  }

  return {
    decision: 'reuse',
    reasons: ['verified cache dependencies match and fit membership is disjoint from the holdout'],
  };
}

function assessResume(request, artifact) {
  const reasons = artifactProblems(artifact, 'checkpoint');
  reasons.push(...identityProblems(request?.identity, ID_KEYS, 'request'));
  reasons.push(...identityProblems(artifact?.identity, ID_KEYS, 'artifact'));
  reasons.push(...requiredStateProblems(request, artifact));
  reasons.push(...holdoutProblems(request, artifact));
  if (reasons.length > 0) return blocked(...reasons);

  const changed = mismatchedKeys(request.identity, artifact.identity, ID_KEYS);
  if (changed.length > 0) {
    return blocked(`resume identity mismatch: ${changed.join(', ')}`);
  }

  return {
    decision: 'resume',
    reasons: ['verified checkpoint identities and all required training state match'],
  };
}

function assessWarmStart(request, artifact) {
  const reasons = artifactProblems(artifact, 'checkpoint');
  reasons.push(...identityProblems(request?.identity, ['architecture'], 'request'));
  reasons.push(...identityProblems(artifact?.identity, ['architecture'], 'artifact'));
  reasons.push(...holdoutProblems(request, artifact));
  if (!isRecord(artifact?.state) || artifact?.state?.model !== true) {
    reasons.push('verified model weights are missing');
  }
  if (reasons.length > 0) return blocked(...reasons);

  if (request.identity.architecture !== artifact.identity.architecture) {
    return blocked('warm-start architecture is incompatible');
  }

  return {
    decision: 'warm-start',
    reasons: ['explicit warm-start has verified model weights and compatible architecture'],
  };
}

export function assessReuse(request, artifact) {
  if (!isRecord(request)) return blocked('request manifest is missing or malformed');

  switch (request.operation) {
    case 'cache':
      return assessCache(request, artifact);
    case 'resume':
      return assessResume(request, artifact);
    case 'warm-start':
      return assessWarmStart(request, artifact);
    default:
      return blocked(`unsupported operation: ${String(request.operation)}`);
  }
}
