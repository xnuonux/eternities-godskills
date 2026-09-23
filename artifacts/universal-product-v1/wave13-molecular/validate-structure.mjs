import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ids = ['r0020', 'r0022', 'r0048', 'r0056', 'r0077', 'r0084', 'r0111', 'r0113'];
const expectedPlanSha256 = '4e68ad4b393440c5f602e6331ae9f824a9f17672d939a347fd00d3ef8d53c6a6';
const expectedBaseline = '7438872d9ac89762608f4b05ef213298eb4b1a50';
const expectedSourceCommit = '2d90941a2985ca177f96e200f0708d31b53dc1f7';
const required = [
  'source-integrity.json',
  'source-dispositions.json',
  'cases.md',
  'author-report.md',
  'author-receipt.json',
  'proposed-product/interatomic-model-validation/SKILL.md',
  'proposed-product/interatomic-model-validation/skill.json',
];
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
const read = (relative) => readFileSync(resolve(here, relative), 'utf8');
const parse = (relative) => JSON.parse(read(relative));

for (const file of required) check(existsSync(resolve(here, file)), `missing required artifact: ${file}`);

let integrity;
let dispositions;
let metadata;
let skill;
let cases;
let report;
let receipt;
try { integrity = parse('source-integrity.json'); } catch (error) { errors.push(`source-integrity.json: ${error.message}`); }
try { dispositions = parse('source-dispositions.json'); } catch (error) { errors.push(`source-dispositions.json: ${error.message}`); }
try { metadata = parse('proposed-product/interatomic-model-validation/skill.json'); } catch (error) { errors.push(`skill.json: ${error.message}`); }
try { skill = read('proposed-product/interatomic-model-validation/SKILL.md'); } catch (error) { errors.push(`SKILL.md: ${error.message}`); }
try { cases = read('cases.md'); } catch (error) { errors.push(`cases.md: ${error.message}`); }
try { report = read('author-report.md'); } catch (error) { errors.push(`author-report.md: ${error.message}`); }
try { receipt = parse('author-receipt.json'); } catch (error) { errors.push(`author-receipt.json: ${error.message}`); }

if (integrity) {
  check(integrity.task?.familyId === 'molecular-materials-modeling', 'integrity family mismatch');
  check(integrity.task?.baselineCommit === expectedBaseline, 'baseline commit mismatch');
  check(integrity.task?.sourceCommit === expectedSourceCommit, 'pinned source commit mismatch');
  check(JSON.stringify(integrity.task?.assignedIds) === JSON.stringify(ids), 'assigned source IDs/order mismatch');
  check(integrity.identityInputs?.find((x) => x.path === 'data/universal-product-v1/family-plan.jsonl')?.sha256 === expectedPlanSha256, 'fixed family-plan digest mismatch');
  check(integrity.bodyReadingMethod?.metadataIsNotBodyReview === true, 'metadata/body-review distinction missing');
  check(integrity.bodyReadingMethod?.wave7FamilyBodyFormsUsedAsBodyReview === false, 'classification data incorrectly used as body review');
  check(integrity.sources?.length === ids.length, 'integrity source count is not eight');
  check(JSON.stringify(integrity.sources?.map((x) => x.id)) === JSON.stringify(ids), 'integrity source IDs/order mismatch');
  for (const source of integrity.sources ?? []) {
    check(source.pinnedCommit === expectedSourceCommit && source.currentHead === expectedSourceCommit, `${source.id}: pinned/current commit mismatch`);
    check(source.sourcePathStatus === 'clean', `${source.id}: source path is not recorded clean`);
    check(source.hashesAgree === true, `${source.id}: integrity agreement flag is false`);
    check(source.planBodySha256 === source.intakeBodySha256 && source.intakeBodySha256 === source.currentRawSha256, `${source.id}: raw SHA-256 values disagree`);
    check(source.intakeGitBlob === source.currentGitBlob && source.currentGitBlob === source.pinnedGitBlob, `${source.id}: Git blob values disagree`);
    check(source.linesRead === source.lineCount, `${source.id}: recorded body read is incomplete`);
  }
  const fresh = integrity.sources?.filter((x) => x.bodyReadStatus === 'complete-current-entrypoint-read') ?? [];
  const reused = integrity.sources?.filter((x) => x.bodyReadStatus === 'reused-exact-prior-complete-review') ?? [];
  check(fresh.length === 7, `expected seven fresh complete reads, found ${fresh.length}`);
  check(reused.length === 1 && reused[0]?.id === 'r0113' && reused[0]?.priorBodyReview?.currentIdentityMatches === true, 'r0113 exact prior review reuse is not verified');
  check(integrity.licenseEvidence?.uncertainty?.includes('Per-file notices') && integrity.licenseEvidence?.uncertainty?.includes('legal clearance'), 'license/provenance uncertainty not explicit');
}

if (dispositions) {
  check(dispositions.familyId === 'molecular-materials-modeling', 'dispositions family mismatch');
  check(JSON.stringify(dispositions.sources?.map((x) => x.id)) === JSON.stringify(ids), 'disposition source IDs/order mismatch');
  for (const source of dispositions.sources ?? []) {
    check(['pattern-reference', 'rejected'].includes(source.bodyDisposition), `${source.id}: invalid body disposition`);
    check(Array.isArray(source.retainedMechanisms) && Array.isArray(source.rejectedMechanisms), `${source.id}: retained/rejected mechanism arrays missing`);
    check(Array.isArray(source.ownerMapping) && source.ownerMapping.length > 0, `${source.id}: owner mapping missing`);
    check(typeof source.bodyLevelReason === 'string' && source.bodyLevelReason.length > 30, `${source.id}: body-level rationale missing`);
  }
  check(dispositions.summary?.newDrafts === 1, 'new draft count mismatch');
  check(dispositions.summary?.adoptionOrInstallationAuthorized === false, 'adoption/installation boundary missing');
}

if (metadata) {
  check(metadata.id === 'interatomic-model-validation', 'candidate metadata ID mismatch');
  check(metadata.maturity === 'draft', 'candidate is not marked draft');
  check(metadata.specializes === 'physics-constrained-numerical-validation', 'candidate owner relationship mismatch');
  check(JSON.stringify(metadata.provenance?.filter((x) => x.kind === 'pattern-reference').map((x) => x.sourceId)) === JSON.stringify(['r0020', 'r0022', 'r0048', 'r0056', 'r0077']), 'candidate provenance IDs mismatch');
}

if (skill) {
  for (const heading of ['Declare the claim and operating domain', 'Protect the evaluation comparison', 'Match checks to the intended use', 'Report a bounded disposition', 'Route boundaries']) {
    check(skill.includes(`## ${heading}`), `candidate missing section: ${heading}`);
  }
  check(skill.includes('Do not import universal error limits'), 'application-specific acceptance boundary missing');
  check(skill.includes('does not train a model') && skill.includes('or certify a model'), 'non-training/certification boundary missing');
}

if (cases) {
  for (const kind of ['Direct', 'Paraphrase', 'Exclusion', 'Conflict', 'Boundary']) check(cases.includes(`| ${kind} |`), `case class missing: ${kind}`);
}

if (report) {
  for (const id of ids) check(report.includes(id), `author report omits ${id}`);
  check(report.includes('independent review') && report.includes('not adopted or installed'), 'author report maturity/review boundary missing');
  check(report.includes('performance claim'), 'author report performance-evidence boundary missing');
}

if (receipt) {
  check(receipt.result === 'ready-for-independent-review', 'receipt result mismatch');
  check(receipt.scope === 'artifacts/universal-product-v1/wave13-molecular/', 'receipt scope mismatch');
  check(receipt.structuralValidation?.exitCode === 0, 'receipt does not record a passing structural validation');
  check(receipt.structuralValidation?.command === 'node artifacts/universal-product-v1/wave13-molecular/validate-structure.mjs', 'receipt validation command mismatch');
  const digests = receipt.artifactSha256 ?? {};
  const digestPaths = Object.keys(digests).sort();
  const expectedDigestPaths = [
    'author-report.md',
    'cases.md',
    'proposed-product/interatomic-model-validation/SKILL.md',
    'proposed-product/interatomic-model-validation/skill.json',
    'source-dispositions.json',
    'source-integrity.json',
    'validate-structure.mjs',
  ].sort();
  check(JSON.stringify(digestPaths) === JSON.stringify(expectedDigestPaths), 'receipt artifact digest path set mismatch');
  for (const [relative, expected] of Object.entries(digests)) {
    const absolute = resolve(here, relative);
    check(absolute.startsWith(`${here}${sep}`), `receipt digest path escapes assigned folder: ${relative}`);
    if (existsSync(absolute)) {
      const actual = createHash('sha256').update(readFileSync(absolute)).digest('hex');
      check(/^[0-9a-f]{64}$/.test(expected), `receipt has malformed SHA-256 for ${relative}`);
      check(actual === expected, `receipt SHA-256 mismatch for ${relative}`);
    } else {
      check(false, `receipt digest target is missing: ${relative}`);
    }
  }
}

const repoRoot = resolve(here, '../../..');
check(repoRoot.endsWith('universal-product-v1'), 'validator scope root did not resolve to the assigned checkout');

if (errors.length) {
  console.error(`FAIL structural validation (${errors.length} issue${errors.length === 1 ? '' : 's'})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log('PASS structural validation');
  console.log('PASS exact eight IDs, pinned baseline/plan/source identities, and source hash/blob/read receipts');
  console.log('PASS body-level dispositions, owner mappings, draft provenance, and boundaries');
  console.log('PASS direct/paraphrase/exclusion/conflict/boundary case coverage and report completeness');
}
