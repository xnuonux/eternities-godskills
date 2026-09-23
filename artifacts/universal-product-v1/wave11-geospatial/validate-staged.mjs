import {readFile, readdir, stat, lstat, realpath} from 'node:fs/promises';
import {resolve, dirname, basename, relative, isAbsolute, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const wave = dirname(fileURLToPath(import.meta.url));
const root = resolve(wave, '..', '..', '..');
const proposed = resolve(wave, 'proposed-product');
const product = resolve(root, 'product');
const failures = [];
const pass = [];
const check = (condition, message) => condition ? pass.push(message) : failures.push(message);
const inside = (base, target) => {
  const rel = relative(base, target);
  return rel === '' || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`));
};
const slash = value => value.split(sep).join('/');
const safeRel = value => typeof value === 'string' && value.length > 0 && !value.includes('\\') && !value.includes(':') && !value.startsWith('/') && value.split('/').every(part => part && part !== '.' && part !== '..');
const shippedSafeRel = value => typeof value === 'string' && value.length > 0 && !value.includes('\\') && !value.includes(':') && !value.startsWith('/') && value.split('/').every(part => part && part !== '.' && part !== '..' && !/[. ]$|[<>"|?*\x00-\x1f]/.test(part) && !/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part));
const noLinks = async path => {
  let current = resolve(path);
  while (true) {
    if (await exists(current)) {
      const statValue = await lstat(current);
      check(!statValue.isSymbolicLink(), `symlink or reparse path rejected: ${current}`);
    }
    const up = dirname(current);
    if (up === current) break;
    current = up;
  }
};
const containedFile = async (base, target, message, kind = 'resource') => {
  const resolved = resolve(base, target);
  const declaredShape = kind !== 'resource' || shippedSafeRel(target);
  const validShape = !isAbsolute(target) && declaredShape && safeRel(slash(relative(base, resolved))) && inside(base, resolved);
  check(validShape, kind === 'link' ? `${message}: cross-skill or escaping link rejected` : `${message}: escaping or absolute resource rejected`);
  check(await exists(resolved), `${message}: exists`);
  if (!await exists(resolved)) return;
  await noLinks(resolved);
  const [realBase, realTarget] = await Promise.all([realpath(base), realpath(resolved)]);
  check(inside(realBase, realTarget), kind === 'link' ? `${message}: cross-skill or escaping link rejected` : `${message}: escaping or absolute resource rejected`);
  check((await lstat(resolved)).isFile(), `${message}: regular file`);
};
const exists = async path => {
  try { await stat(path); return true; } catch { return false; }
};
const walk = async directory => {
  const output = [];
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const path = resolve(directory, entry.name);
    check(!entry.isSymbolicLink(), `symlink/reparse escape rejected: ${path}`);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) output.push(...await walk(path));
    else output.push(path);
  }
  return output;
};

const waveFiles = await walk(wave);
const jsonFiles = waveFiles.filter(path => path.endsWith('.json'));
for (const path of jsonFiles) JSON.parse(await readFile(path, 'utf8'));
check(jsonFiles.length >= 3, `parsed ${jsonFiles.length} wave JSON files`);

const plan = (await readFile(resolve(root, 'data/universal-product-v1/family-plan.jsonl'), 'utf8'))
  .trim().split(/\r?\n/).map(JSON.parse)
  .filter(row => ['geospatial-analysis', 'ecological-environmental-analysis'].includes(row.familyId));
const expectedIds = plan.map(row => row.id).sort();
const dispositions = JSON.parse(await readFile(resolve(wave, 'source-dispositions.json'), 'utf8'));
const dispositionIds = dispositions.rows.map(row => row.id).sort();
check(JSON.stringify(dispositionIds) === JSON.stringify(expectedIds), 'source-dispositions covers exactly the 29 family leads');
check(new Set(dispositionIds).size === 29, 'source-dispositions IDs are unique');

const actualCounts = {};
for (const row of dispositions.rows) actualCounts[row.disposition] = (actualCounts[row.disposition] ?? 0) + 1;
const summaryMapping = {
  priorEvidenceLinked: 'prior-evidence-linked',
  patternReferenceIndependentMethod: 'pattern-reference-independent-method',
  patternReferenceIndependentExtension: 'pattern-reference-independent-extension',
  coveredExistingOwner: 'covered-existing-owner',
  deferredSeparateOwner: 'deferred-separate-owner',
  deferredPlatformSpecific: 'deferred-platform-specific',
  rejectedPlatformAdapter: 'rejected-platform-adapter',
  rejectedInsufficientMechanism: 'rejected-insufficient-mechanism'
};
for (const [field, disposition] of Object.entries(summaryMapping)) {
  check(dispositions.sourceReadSummary[field] === (actualCounts[disposition] ?? 0), `summary ${field} matches rows`);
}
check(Object.values(actualCounts).reduce((sum, value) => sum + value, 0) === 29, 'disposition counts sum to 29');

const integrity = JSON.parse(await readFile(resolve(wave, 'source-integrity-v2.json'), 'utf8'));
const integrityIds = integrity.rows.map(row => row.id).sort();
check(JSON.stringify(integrityIds) === JSON.stringify(expectedIds), 'source-integrity covers exactly the 29 family leads');
check(integrity.schema === 'godskills-wave11-source-integrity-v2', 'source-integrity-v2 schema is current');
check(integrity.rows.every(row => row.sha256Match && row.blobMatch && row.commitMatch && row.pinnedPacketFieldsMatch), 'all integrity rows match raw hash, blob, commit and packet fields');
check(integrity.rows.every(row => !Object.hasOwn(row, 'reviewExtent') && typeof row.declaredSourceRead === 'string'), 'hash identity is separate from declared source-read metadata');
check(integrity.readEvidence?.independentReview?.reportedCommandObservation?.coveredEntrypoints === 29 && integrity.readEvidence?.independentReview?.reportedCommandObservation?.missingEntrypoints === 0, 'independent review binds 29 covered and 0 missing author read commands');
check(/not model comprehension/i.test(integrity.readEvidence?.independentReview?.claimBoundary ?? ''), 'read evidence states the comprehension boundary');

const proposedFiles = await walk(proposed);
const skillJsonFiles = proposedFiles.filter(path => path.endsWith('skill.json'));
const skillIds = new Set();
for (const path of skillJsonFiles) {
  const skill = JSON.parse(await readFile(path, 'utf8'));
  const directoryName = basename(dirname(path));
  check(skill.id === directoryName, `${skill.id}: id matches directory`);
  skillIds.add(skill.id);
  for (const resource of skill.resources ?? []) {
    await containedFile(dirname(path), resource, `${skill.id}: resource ${resource}`);
  }
}
check(skillIds.size === 4, `staged ${skillIds.size} product skills`);

const productSkillIds = new Set((await readdir(resolve(product, 'skills'), {withFileTypes: true}))
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name));
for (const path of skillJsonFiles) {
  const skill = JSON.parse(await readFile(path, 'utf8'));
  for (const related of skill.related ?? []) {
    check(skillIds.has(related) || productSkillIds.has(related), `${skill.id}: related ${related} resolves`);
  }
}

for (const path of proposedFiles.filter(path => path.endsWith('.md'))) {
  const text = await readFile(path, 'utf8');
  for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1];
    if (/^(https?:|#|mailto:)/.test(target)) continue;
    const clean = target.split('#')[0];
    await containedFile(dirname(path), clean, `${relative(proposed, path)}: link ${target}`, 'link');
  }
}

for (const path of proposedFiles) {
  const text = await readFile(path, 'utf8');
  check(!/(?:[A-Za-z]:\\\\|C:\/|\/Users\/|D:\/|D:\\\\)/.test(text), `${relative(proposed, path)} has no workstation path`);
}

console.log(JSON.stringify({passed: pass.length, failed: failures.length, failures}, null, 2));
if (failures.length) process.exitCode = 1;
