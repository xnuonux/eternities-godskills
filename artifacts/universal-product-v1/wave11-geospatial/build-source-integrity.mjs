import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve, relative, isAbsolute, sep, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const artifactDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(artifactDir, '..', '..', '..');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const lines = bytes => bytes.toString('utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
const inside = (base, target) => {
  const rel = relative(base, target);
  return rel !== '' && !isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`);
};
const git = (repository, args) => execFileSync('git', ['-C', repository, ...args], {
  encoding: 'utf8',
  windowsHide: true,
  env: {...process.env, GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'safe.directory', GIT_CONFIG_VALUE_0: repository}
}).trim();

const inputPaths = {
  familyPlan: 'data/universal-product-v1/family-plan.jsonl',
  familySourceObservations: 'data/universal-product-v1/family-source-observations.json',
  familyPacket: 'data/universal-product-v1/family-packet.json',
  sourcesJsonl: 'data/quarry-intake-2026-09-21-exa/sources.jsonl',
  intakeManifest: 'data/quarry-intake-2026-09-21-exa/manifest.json',
  sourceDispositions: 'artifacts/universal-product-v1/wave11-geospatial/source-dispositions.json',
  independentReview: 'artifacts/universal-product-v1/wave11-geospatial/independent-review.md',
  reviewReceipt: 'artifacts/universal-product-v1/wave11-geospatial/review-receipt.json'
};

const inputBytes = {};
for (const [name, path] of Object.entries(inputPaths)) inputBytes[name] = await readFile(resolve(root, path));
const plan = lines(inputBytes.familyPlan);
const sources = lines(inputBytes.sourcesJsonl);
const observations = JSON.parse(inputBytes.familySourceObservations);
const packet = JSON.parse(inputBytes.familyPacket);
const dispositions = JSON.parse(inputBytes.sourceDispositions);
const independentReview = inputBytes.independentReview.toString('utf8');
const reviewReceipt = JSON.parse(inputBytes.reviewReceipt);
const familyIds = new Set(['geospatial-analysis', 'ecological-environmental-analysis']);
const leads = plan.filter(row => familyIds.has(row.familyId));
if (leads.length !== 29) throw new Error(`expected 29 leads, found ${leads.length}`);

const observationById = new Map(observations.rows.map(row => [row.id, row]));
const packetItemById = new Map(packet.items.map(row => [row.id, row]));
const dispositionById = new Map(dispositions.rows.map(row => [row.id, row]));
const readCoverageCheck = reviewReceipt.checks?.find(row => row.id === 'author-entrypoint-read-coverage');
if (!readCoverageCheck || !/^29 covered, 0 missing\b/.test(readCoverageCheck.result)) {
  throw new Error('review receipt does not bind 29 covered, 0 missing author entrypoint read commands');
}
if (!/not a claim that the first reviewer attempt succeeded/i.test(independentReview)) {
  throw new Error('independent review recovery boundary is missing');
}
const rows = [];
for (const lead of leads) {
  const candidates = sources.filter(row => row.sourceId === lead.sourceId && row.bodySha256 === lead.bodySha256);
  if (candidates.length !== 1) throw new Error(`${lead.id}: expected one source record, found ${candidates.length}`);
  const source = candidates[0];
  const observation = observationById.get(lead.id);
  const packetItem = packetItemById.get(lead.id);
  const disposition = dispositionById.get(lead.id);
  if (!observation || observation.status !== 'bytes-verified') throw new Error(`${lead.id}: source observation is not bytes-verified`);
  if (!packetItem) throw new Error(`${lead.id}: missing pinned packet item`);
  if (!disposition || disposition.bodySha256 !== lead.bodySha256) throw new Error(`${lead.id}: missing or mismatched source disposition`);
  for (const key of ['id', 'bodySha256', 'sourceId', 'name', 'category', 'gapLabel', 'description']) {
    if (JSON.stringify(packetItem[key]) !== JSON.stringify(lead[key])) throw new Error(`${lead.id}: packet mismatch at ${key}`);
  }

  const repository = resolve(source.destination);
  const requested = resolve(repository, source.path);
  if (!inside(repository, requested)) throw new Error(`${lead.id}: source path escapes repository`);
  const bytes = await readFile(requested);
  const rawSha256 = sha256(bytes);
  const actualGitBlob = git(repository, ['hash-object', source.path]);
  const pinnedGitBlob = git(repository, ['rev-parse', `${source.commit}:${source.path}`]);
  const currentCommit = git(repository, ['rev-parse', 'HEAD']);
  const sha256Match = rawSha256 === lead.bodySha256;
  const blobMatch = actualGitBlob === source.gitBlob && pinnedGitBlob === source.gitBlob;
  const commitMatch = currentCommit === source.commit;
  if (!sha256Match || !blobMatch || !commitMatch) throw new Error(`${lead.id}: identity mismatch`);

  rows.push({
    id: lead.id,
    sourceId: lead.sourceId,
    repositoryRoot: repository,
    repositoryRelativePath: source.path,
    rawSha256,
    expectedRawSha256: lead.bodySha256,
    gitBlob: actualGitBlob,
    pinnedGitBlob,
    expectedGitBlob: source.gitBlob,
    pinnedCommit: source.commit,
    currentCommit,
    bytes: bytes.length,
    sha256Match,
    blobMatch,
    commitMatch,
    sourceObservationStatus: observation.status,
    pinnedPacketFieldsMatch: true,
    declaredSourceRead: disposition.sourceRead,
    licenseHint: source.licenseHint,
    licenseReview: 'metadata-or-body-claim-only; license text not reviewed in wave11'
  });
}

const output = {
  schema: 'godskills-wave11-source-integrity-v2',
  families: [...familyIds],
  snapshot: packet.snapshot,
  queueDigest: packet.queueDigest,
  inputs: Object.fromEntries(Object.entries(inputBytes).map(([name, bytes]) => [name, {
    path: inputPaths[name],
    bytes: bytes.length,
    sha256: sha256(bytes)
  }])),
  verificationBoundary: {
    declaredLocatorOnly: true,
    rawBodyHash: 'SHA-256 recomputed from the manifest-resolved exact warehouse file',
    gitBodyIdentity: 'git hash-object and git rev-parse COMMIT:PATH both matched the manifest gitBlob',
    commitIdentity: 'warehouse HEAD matched the pinned source commit with command-local safe.directory only',
    pinnedPacket: 'id, bodySha256, sourceId, name, category, gapLabel and description matched family-plan.jsonl',
    sourceObservation: 'family-source-observations.json status bytes-verified',
    hashIdentityDoesNotEstablishRead: true,
    upstreamCodeExecuted: false,
    upstreamInstructionsFollowed: false,
    linkedReferencesRead: false,
    networkCalls: 0
  },
  readEvidence: {
    declared: {
      source: inputPaths.sourceDispositions,
      field: 'rows[].sourceRead',
      values: Object.fromEntries([...new Set(rows.map(row => row.declaredSourceRead))].sort().map(value => [value, rows.filter(row => row.declaredSourceRead === value).length])),
      meaning: 'source disposition metadata; not independently re-read or comprehended by this generator'
    },
    independentReview: {
      source: inputPaths.independentReview,
      sourceSha256: sha256(inputBytes.independentReview),
      receipt: inputPaths.reviewReceipt,
      receiptSha256: sha256(inputBytes.reviewReceipt),
      reportedCommandObservation: {
        checkId: readCoverageCheck.id,
        evidence: readCoverageCheck.evidence,
        result: readCoverageCheck.result,
        coveredEntrypoints: 29,
        missingEntrypoints: 0
      },
      claimBoundary: 'Successful non-empty author read commands were observed in recovered command output; this is not model comprehension or a fresh read audit.'
    }
  },
  summary: {
    total: rows.length,
    byteIdentity: {
      sha256Matched: rows.filter(row => row.sha256Match).length,
      blobMatched: rows.filter(row => row.blobMatch).length,
      commitMatched: rows.filter(row => row.commitMatch).length
    },
    declaredSourceRead: Object.fromEntries([...new Set(rows.map(row => row.declaredSourceRead))].sort().map(value => [value, rows.filter(row => row.declaredSourceRead === value).length])),
    independentReviewReadCommands: {covered: 29, missing: 0}
  },
  rows
};

const target = resolve(artifactDir, 'source-integrity-v2.json');
await writeFile(target, `${JSON.stringify(output, null, 2)}\n`, {flag: 'wx'});
console.log(JSON.stringify({target, ...output.summary}));
