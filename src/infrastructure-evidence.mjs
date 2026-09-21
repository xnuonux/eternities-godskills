const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.trim().length > 0;
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const unknown = (value, keys) => object(value) && Object.keys(value).some(k => !keys.includes(k));

// Pure completeness check on caller-supplied JSON, NOT authentication or execution.
// Evidence digests are references, not proof that their contents are true.
export function assessInfrastructureEvidence(packet) {
  const issues = [];
  const p = object(packet) ? packet : {};
  if (unknown(p,['mode','subjectDigest','toolVersion','isolated','mockedProviders','externalEffects','checks','authorityRecord','cleanup'])) issues.push('unknown-packet-field');
  if (!['plan','apply'].includes(p.mode)) issues.push('mode-invalid');
  if (!hash(p.subjectDigest)) issues.push('subject-unbound');
  if (!text(p.toolVersion)) issues.push('version-missing');
  if (p.isolated !== true) issues.push('isolation-unproven');
  const checks = Array.isArray(p.checks) ? p.checks : [];
  const ids = new Set();
  for (const c of checks) {
    if (!object(c)) { issues.push('check-malformed'); continue; }
    if (unknown(c,['id','kind','passed','subjectDigest','evidenceDigest'])) issues.push('unknown-check-field');
    if (!text(c.id)) issues.push('check-id-missing');
    else if (ids.has(c.id)) issues.push('duplicate-check-id');
    else ids.add(c.id);
    if (!['positive','negative'].includes(c.kind)) issues.push('check-kind-invalid');
    if (c.passed !== true) issues.push('check-failed');
    if (!hash(c.evidenceDigest)) issues.push('check-evidence-unbound');
    if (!hash(c.subjectDigest) || c.subjectDigest !== p.subjectDigest) issues.push('check-subject-unbound');
  }
  for (const kind of ['positive','negative']) {
    if (!checks.some(c => object(c) && c.kind === kind)) issues.push(`${kind}-check-missing`);
  }
  if (p.mode === 'plan') {
    if ('cleanup' in p || 'authorityRecord' in p) issues.push('plan-apply-fields-conflict');
    if (p.mockedProviders !== true || p.externalEffects !== false) issues.push('plan-effects-unresolved');
  }
  if (p.mode === 'apply') {
    const a = p.authorityRecord;
    if (unknown(a,['subjectDigest','reference','costOwner'])) issues.push('unknown-authority-field');
    if (unknown(p.cleanup,['passed','subjectDigest','evidenceDigest'])) issues.push('unknown-cleanup-field');
    if (!object(a) || !text(a.reference) || !text(a.costOwner) ||
        !hash(a.subjectDigest) || a.subjectDigest !== p.subjectDigest) issues.push('authority-record-unbound');
    if (p.externalEffects !== true) issues.push('apply-effects-undeclared');
    if (!object(p.cleanup) || p.cleanup.passed !== true || !hash(p.cleanup.evidenceDigest) ||
        !hash(p.cleanup.subjectDigest) || p.cleanup.subjectDigest !== p.subjectDigest) issues.push('cleanup-unproven');
  }
  return {status:issues.length ? 'incomplete' : 'evidence-complete',
    authority:'none', promotion:'experimental', issues:[...new Set(issues)]};
}
