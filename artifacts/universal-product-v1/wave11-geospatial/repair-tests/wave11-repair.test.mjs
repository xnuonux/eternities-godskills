import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, readFile, cp, symlink, rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync, spawnSync} from 'node:child_process';
import {buildProduct} from '../../../../product/lib/product.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const wave = resolve(here, '..');
const root = resolve(here, '..', '..', '..', '..');
const product = resolve(root, 'product');
const proposed = resolve(wave, 'proposed-product');

const run = (script, args = [], cwd = root) => spawnSync(process.execPath, [script, ...args], {
  cwd,
  encoding: 'utf8',
  windowsHide: true
});

const tempRoot = async label => {
  const path = await mkdtemp(join(tmpdir(), `godskills wave %20 # ${label}-`));
  return path;
};

const cleanup = async path => {
  const resolved = resolve(path);
  assert.ok(resolved.startsWith(resolve(tmpdir())), `refusing to remove non-temp path ${resolved}`);
  await rm(resolved, {recursive: true, force: true});
};

const writeJson = (path, value) => writeFile(path, `${JSON.stringify(value, null, 2)}\n`);

const makePlanRows = () => Array.from({length: 29}, (_, index) => {
  const id = `r${String(index + 1).padStart(4, '0')}`;
  return {
    id,
    familyId: index < 15 ? 'geospatial-analysis' : 'ecological-environmental-analysis',
    sourceId: `fixture/source-${index + 1}`,
    bodySha256: `sha-${index + 1}`,
    name: `Fixture source ${index + 1}`,
    category: 'fixture',
    gapLabel: `gap-${index + 1}`,
    description: `Fixture description ${index + 1}`
  };
});

const makeDispositionFixture = rows => ({
  schema: 'godskills-wave11-source-dispositions-v1',
  rows: rows.map((row, index) => ({
    id: row.id,
    bodySha256: row.bodySha256,
    disposition: index % 2 ? 'rejected-insufficient-mechanism' : 'pattern-reference-independent-method',
    sourceRead: index % 2 ? 'full-entrypoint' : 'full-entrypoint-reverified',
    retainedMechanisms: [],
    rejectedOrDeferred: [],
    adoptedIn: [],
    license: 'fixture metadata only'
  })),
  sourceReadSummary: {
    total: 29,
    fullEntrypointReads: 29,
    priorEvidenceLinked: 0,
    patternReferenceIndependentMethod: 15,
    patternReferenceIndependentExtension: 0,
    coveredExistingOwner: 0,
    deferredSeparateOwner: 0,
    deferredPlatformSpecific: 0,
    rejectedPlatformAdapter: 0,
    rejectedInsufficientMechanism: 14
  }
});

const makeIntegrityFixture = rows => ({
  schema: 'godskills-wave11-source-integrity-v2',
  rows: rows.map(row => ({
    id: row.id,
    sha256Match: true,
    blobMatch: true,
    commitMatch: true,
    pinnedPacketFieldsMatch: true,
    declaredSourceRead: 'full-entrypoint'
  })),
  readEvidence: {
    independentReview: {
      reportedCommandObservation: {coveredEntrypoints: 29, missingEntrypoints: 0},
      claimBoundary: 'Command output observed; not model comprehension.'
    }
  }
});

const makeSkill = (id, extra = {}) => ({
  id,
  category: 'science',
  summary: `Fixture ${id}`,
  triggers: [id],
  antiTriggers: [],
  taskTypes: ['verify'],
  related: [],
  resources: [],
  maturity: 'draft',
  provenance: [{kind: 'authoring', source: 'repair-tests', note: 'fixture only'}],
  ...extra
});

const makeValidatorFixture = async (tamper = 'none') => {
  const fixtureRoot = await tempRoot('validator');
  const fixtureWave = resolve(fixtureRoot, 'artifacts', 'universal-product-v1', 'wave11-geospatial');
  const fixtureProposed = resolve(fixtureWave, 'proposed-product');
  const fixtureProduct = resolve(fixtureRoot, 'product');
  await mkdir(resolve(fixtureRoot, 'data', 'universal-product-v1'), {recursive: true});
  await mkdir(fixtureWave, {recursive: true});
  await cp(resolve(wave, 'validate-staged.mjs'), resolve(fixtureWave, 'validate-staged.mjs'));
  const rows = makePlanRows();
  await writeFile(resolve(fixtureRoot, 'data', 'universal-product-v1', 'family-plan.jsonl'), `${rows.map(row => JSON.stringify(row)).join('\n')}\n`);
  await writeJson(resolve(fixtureWave, 'source-dispositions.json'), makeDispositionFixture(rows));
  await writeJson(resolve(fixtureWave, 'source-integrity-v2.json'), makeIntegrityFixture(rows));
  await writeJson(resolve(fixtureWave, 'repair-fixture.json'), {schema: 'repair-fixture-v1'});

  for (const id of [
    'ecological-sampling-and-detection-uncertainty',
    'geospatial-coordinate-integrity',
    'landscape-connectivity-analysis',
    'terrain-watershed-analysis'
  ]) {
    const dir = resolve(fixtureProposed, 'skills', id);
    await mkdir(resolve(dir, 'references'), {recursive: true});
    await writeJson(resolve(dir, 'skill.json'), makeSkill(id));
    await writeFile(resolve(dir, 'SKILL.md'), `---\nname: ${id}\ndescription: fixture\n---\n\n# ${id}\n\nSee [local](references/detail.md).\n`);
    await writeFile(resolve(dir, 'references', 'detail.md'), `# ${id} detail\n`);
  }
  await mkdir(resolve(fixtureProduct, 'skills', 'other-skill'), {recursive: true});
  await writeFile(resolve(fixtureProduct, 'skills', 'other-skill', 'SKILL.md'), '# other skill\n');

  const skillDir = resolve(fixtureProposed, 'skills', 'geospatial-coordinate-integrity');
  const skillJsonPath = resolve(skillDir, 'skill.json');
  const skill = JSON.parse(await readFile(skillJsonPath, 'utf8'));
  if (tamper === 'escape-resource') {
    await mkdir(resolve(fixtureProposed, 'skills', 'other'), {recursive: true});
    await writeFile(resolve(fixtureProposed, 'skills', 'other', 'a.md'), '# outside\n');
    skill.resources = ['../other/a.md'];
  } else if (tamper === 'absolute-resource') {
    const outside = resolve(fixtureProposed, 'outside.md');
    await writeFile(outside, '# outside\n');
    skill.resources = [outside];
  } else if (tamper === 'cross-skill-link') {
    await mkdir(resolve(fixtureProposed, 'skills', 'other-skill'), {recursive: true});
    await writeFile(resolve(fixtureProposed, 'skills', 'other-skill', 'SKILL.md'), '# other skill\n');
    await writeFile(resolve(skillDir, 'SKILL.md'), `---\nname: ${skill.id}\ndescription: fixture\n---\n\n# ${skill.id}\n\nSee [other](../other-skill/SKILL.md).\n`);
  } else if (tamper === 'reparse-escape') {
    const outsideDir = resolve(fixtureProposed, 'outside-dir');
    await mkdir(outsideDir, {recursive: true});
    await writeFile(resolve(outsideDir, 'escape.md'), '# outside\n');
    await rm(resolve(skillDir, 'references'), {recursive: true, force: true});
    await symlink(outsideDir, resolve(skillDir, 'references'), 'junction');
    skill.resources = ['references/escape.md'];
  } else if (tamper === 'normalized-resource') {
    await writeFile(resolve(skillDir, 'references', 'vertical-and-surface-comparability.md'), '# contained but noncanonical declaration\n');
    skill.resources = ['references/./vertical-and-surface-comparability.md'];
  }
  await writeJson(skillJsonPath, skill);
  return {fixtureRoot, fixtureWave};
};

const makeGitRepository = async fixtureRoot => {
  const repository = resolve(fixtureRoot, 'warehouse repo %20 #');
  await mkdir(repository, {recursive: true});
  const git = args => execFileSync('git', ['-C', repository, ...args], {encoding: 'utf8', windowsHide: true}).trim();
  git(['init', '-q']);
  git(['config', 'user.email', 'repair-tests@example.invalid']);
  git(['config', 'user.name', 'Repair Tests']);
  const rows = makePlanRows();
  for (const [index, row] of rows.entries()) {
    const path = `src/fixture-${index + 1}.md`;
    await mkdir(resolve(repository, 'src'), {recursive: true});
    await writeFile(resolve(repository, path), `# fixture ${index + 1}\n${row.id}\n`);
  }
  git(['add', '.']);
  git(['commit', '-qm', 'fixture']);
  const commit = git(['rev-parse', 'HEAD']);
  return {repository, rows, commit};
};

const makeGeneratorFixture = async () => {
  const fixtureRoot = await tempRoot('generator');
  const fixtureWave = resolve(fixtureRoot, 'artifacts', 'universal-product-v1', 'wave11-geospatial');
  await mkdir(fixtureWave, {recursive: true});
  await mkdir(resolve(fixtureRoot, 'data', 'universal-product-v1'), {recursive: true});
  await mkdir(resolve(fixtureRoot, 'data', 'quarry-intake-2026-09-21-exa'), {recursive: true});
  await cp(resolve(wave, 'build-source-integrity.mjs'), resolve(fixtureWave, 'build-source-integrity.mjs'));
  const {repository, rows, commit} = await makeGitRepository(fixtureRoot);
  const sources = [];
  for (const [index, row] of rows.entries()) {
    const path = `src/fixture-${index + 1}.md`;
    const bytes = await readFile(resolve(repository, path));
    const bodySha256 = execFileSync('git', ['-C', repository, 'hash-object', path], {encoding: 'utf8'}).trim();
    const gitBlob = bodySha256;
    row.bodySha256 = createHash('sha256').update(bytes).digest('hex');
    sources.push({sourceId: row.sourceId, bodySha256: row.bodySha256, destination: repository, path, gitBlob, commit, licenseHint: 'fixture'});
  }
  await writeFile(resolve(fixtureRoot, 'data', 'universal-product-v1', 'family-plan.jsonl'), `${rows.map(row => JSON.stringify(row)).join('\n')}\n`);
  await writeJson(resolve(fixtureRoot, 'data', 'universal-product-v1', 'family-source-observations.json'), {
    rows: rows.map(row => ({id: row.id, status: 'bytes-verified'}))
  });
  await writeJson(resolve(fixtureRoot, 'data', 'universal-product-v1', 'family-packet.json'), {
    snapshot: 'fixture',
    queueDigest: 'fixture',
    items: rows
  });
  await writeFile(resolve(fixtureRoot, 'data', 'quarry-intake-2026-09-21-exa', 'sources.jsonl'), `${sources.map(row => JSON.stringify(row)).join('\n')}\n`);
  await writeJson(resolve(fixtureRoot, 'data', 'quarry-intake-2026-09-21-exa', 'manifest.json'), {schema: 'fixture'});
  await writeJson(resolve(fixtureWave, 'source-dispositions.json'), makeDispositionFixture(rows));
  await writeFile(resolve(fixtureWave, 'independent-review.md'), '# fixture review\n\nThis is recovery and finalization of an interrupted review, not a claim that the first reviewer attempt succeeded.\n\nAuthor-log entrypoint reads: 29 covered, 0 missing. Command output only, not comprehension.\n');
  await writeJson(resolve(fixtureWave, 'review-receipt.json'), {
    schemaVersion: 'fixture-v1',
    checks: [{
      id: 'author-entrypoint-read-coverage',
      evidence: 'fixture continuation bounded extractor',
      result: '29 covered, 0 missing after Windows/POSIX separator normalization'
    }]
  });
  return {fixtureRoot, fixtureWave};
};

test('shipped builder accepts the repaired candidate in a temporary reviewed overlay', async t => {
  const overlay = await tempRoot('overlay');
  t.after(() => cleanup(overlay));
  await cp(product, resolve(overlay, 'product'), {recursive: true});
  for (const entry of await import('node:fs/promises').then(fs => fs.readdir(resolve(proposed, 'skills'), {withFileTypes: true}))) {
    const source = resolve(proposed, 'skills', entry.name);
    const destination = resolve(overlay, 'product', 'skills', entry.name);
    await cp(source, destination, {recursive: true});
    const skillPath = resolve(destination, 'skill.json');
    const skill = JSON.parse(await readFile(skillPath, 'utf8'));
    skill.maturity = 'instruction-reviewed';
    await writeJson(skillPath, skill);
  }
  await buildProduct(resolve(overlay, 'product'));
  const catalog = JSON.parse(await readFile(resolve(overlay, 'product', 'catalog.json'), 'utf8'));
  const byId = new Map(catalog.skills.map(skill => [skill.id, skill]));
  assert.ok(byId.get('ecological-sampling-and-detection-uncertainty').related.includes('agricultural-observation-and-trial'));
  assert.ok(byId.get('landscape-connectivity-analysis').related.includes('eternities-athena'));
  assert.ok(byId.get('terrain-watershed-analysis').related.includes('geospatial-coordinate-integrity'));
  for (const id of ['ecological-sampling-and-detection-uncertainty', 'landscape-connectivity-analysis', 'terrain-watershed-analysis']) {
    const text = await readFile(resolve(proposed, 'skills', id, 'SKILL.md'), 'utf8');
    assert.ok(!/\]\(\.\.\//.test(text), `${id} keeps relationships outside Markdown links`);
    assert.ok(/\]\(references\//.test(text), `${id} preserves within-skill reference links`);
  }
});

test('development helpers resolve their own paths under spaces and escaped characters', async t => {
  const fixture = await makeValidatorFixture();
  t.after(() => cleanup(fixture.fixtureRoot));
  const result = run(fixture.fixtureWave ? resolve(fixture.fixtureWave, 'validate-staged.mjs') : '', [], fixture.fixtureRoot);
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('integrity generator separates hash identity from read evidence', async t => {
  const fixture = await makeGeneratorFixture();
  t.after(() => cleanup(fixture.fixtureRoot));
  const helper = resolve(fixture.fixtureWave, 'build-source-integrity.mjs');
  const result = run(helper, [], fixture.fixtureRoot);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = JSON.parse(await readFile(resolve(fixture.fixtureWave, 'source-integrity-v2.json'), 'utf8'));
  assert.equal(output.schema, 'godskills-wave11-source-integrity-v2');
  assert.equal(output.summary.byteIdentity.sha256Matched, 29);
  assert.equal(output.rows.every(row => !Object.hasOwn(row, 'reviewExtent')), true);
  assert.equal(output.readEvidence.independentReview.reportedCommandObservation.coveredEntrypoints, 29);
  assert.match(output.readEvidence.independentReview.claimBoundary, /not model comprehension/i);
});

for (const [name, tamper, expected] of [
  ['rejects escaping resources', 'escape-resource', /escaping.*resource|containment/i],
  ['rejects absolute resources', 'absolute-resource', /absolute.*resource|containment/i],
  ['rejects cross-skill Markdown links', 'cross-skill-link', /cross-skill.*link|containment/i],
  ['rejects reparse escapes', 'reparse-escape', /symlink\/reparse.*rejected|containment/i],
  ['rejects normalized dot-segment resource spellings', 'normalized-resource', /escaping.*resource|containment/i]
]) {
  test(name, async t => {
    const fixture = await makeValidatorFixture(tamper);
    t.after(() => cleanup(fixture.fixtureRoot));
    const result = run(resolve(fixture.fixtureWave, 'validate-staged.mjs'), [], fixture.fixtureRoot);
    assert.notEqual(result.status, 0, result.stdout);
    assert.match(`${result.stderr}\n${result.stdout}`, expected);
  });
}
