const AXES = ['research', 'plan', 'build', 'verify', 'recover', 'orchestrate'];
const words = x => new Set(String(x ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? []);
const clipped = (x, n) => String(x ?? '').slice(0, n);

// Metadata-only discovery. A matching hash binds a model label to a recorded
// source identity; it does NOT certify the source, its current bytes or safety.
export function searchColdIntakes(sources, labels, { query, facet, limit = 5 } = {}) {
  if (typeof query !== 'string' || !query.trim() || query.length > 2048) throw new Error('A bounded nonempty query is required');
  if (!Number.isInteger(limit) || limit < 1 || limit > 5) throw new Error('Limit must be 1..5');
  if (facet !== undefined && !AXES.includes(facet)) throw new Error('Unknown facet');
  const identities = new Map(), conflicts = new Set();
  for (const s of sources) {
    if (typeof s.sourceId !== 'string' || !/^[a-f0-9]{64}$/.test(s.bodySha256 ?? '')) continue;
    if (identities.has(s.sourceId) && identities.get(s.sourceId) !== s.bodySha256) conflicts.add(s.sourceId);
    identities.set(s.sourceId, s.bodySha256);
  }
  const groups = new Map();
  for (const s of sources) {
    if (!identities.has(s.sourceId) || identities.get(s.sourceId) !== s.bodySha256 || conflicts.has(s.sourceId)) continue;
    if (!groups.has(s.bodySha256)) groups.set(s.bodySha256, []);
    const group = groups.get(s.bodySha256);
    if (!group.some(x => x.sourceId === s.sourceId)) group.push(s);
  }
  const labelGroups = new Map();
  for (const label of labels) {
    if (!labelGroups.has(label.bodySha256)) labelGroups.set(label.bodySha256, []);
    labelGroups.get(label.bodySha256).push(label);
  }
  const tokens = words(query), results = [];
  for (const [bodySha256, group] of groups) {
    const recorded = labelGroups.get(bodySha256) ?? [];
    const provisionalFacets = AXES.filter(axis => recorded.length && recorded.every(r => {
      const f = r.facets?.[axis];
      return f?.status === 'provisional' && f.value === 'yes' && Number.isFinite(f.confidence) && f.confidence >= .9 && f.confidence <= 1;
    }));
    if (facet && !provisionalFacets.includes(facet)) continue;
    const ranked = group.map(s => {
      const names = words(s.name), description = words(s.description), location = words(`${s.repository} ${s.path}`);
      const score = [...tokens].reduce((n,t) => n + (names.has(t) ? 4 : 0) + (description.has(t) ? 2 : 0) + (location.has(t) ? 1 : 0), 0);
      return { s, score };
    }).sort((a,b) => b.score-a.score || a.s.sourceId.localeCompare(b.s.sourceId));
    const {s,score} = ranked[0];
    if (!score) continue;
    results.push({ sourceId: s.sourceId, bodySha256, name: clipped(s.name, 160), description: clipped(s.description, 400), repository: s.repository, path: s.path, score, aliases: group.slice(0,5).map(x=>x.sourceId), aliasCount: group.length, provisionalFacets, trust: 'untrusted-source-metadata', reviewStatus: 'not-certified-by-this-search', activation: 'none' });
  }
  return results.sort((a,b)=>b.score-a.score || a.sourceId.localeCompare(b.sourceId)).slice(0,limit);
}
