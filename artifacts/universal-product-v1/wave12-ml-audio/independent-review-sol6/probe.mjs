import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve, win32 } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Read-only provenance probe. Warehouse bodies are inert data; only Git read commands run.
const reviewDir = dirname(fileURLToPath(import.meta.url));
const waveDir = resolve(reviewDir, '..');
const repoDir = resolve(waveDir, '../../..');
const json = (path) => JSON.parse(readFileSync(path, 'utf8'));
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const runGit = (cwd, ...args) => {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error(`git ${args[0]} failed in ${cwd}: ${result.stderr.trim()}`);
  return result.stdout.trim();
};
const check = (condition, label, errors) => { if (!condition) errors.push(label); };
const normalized = (path) => win32.normalize(path);
const integrity = json(resolve(waveDir, 'source-integrity.json'));
const dispositions = json(resolve(waveDir, 'source-dispositions.json'));
const authorReceipt = json(resolve(waveDir, 'author-receipt.json'));
const planBytes = readFileSync(resolve(repoDir, 'data/universal-product-v1/family-plan.jsonl'));
const plan = planBytes.toString('utf8').trim().split(/\r?\n/).map(JSON.parse)
  .filter((row) => ['ml-training-evaluation', 'audio-production-analysis'].includes(row.familyId));
const index = new Map(readFileSync(resolve(repoDir, 'data/quarry-intake-2026-09-21-exa/sources.jsonl'), 'utf8')
  .trim().split(/\r?\n/).map(JSON.parse).map((row) => [row.sourceId, row]));
const logPath = 'C:/Users/Dom/.codex/providers/mimo/godskills-wave12-cache-r1-events.jsonl';
const logBytes = readFileSync(logPath);
const logItems = new Map(logBytes.toString('utf8').trim().split(/\r?\n/).map(JSON.parse)
  .filter((row) => row.type === 'item.completed' && row.item?.type === 'command_execution')
  .map((row) => [row.item.id, row.item]));
const wave5Review = readFileSync(resolve(repoDir, 'artifacts/universal-product-v1/wave5/audio-review.md'), 'utf8');
const errors = [];
const results = [];

check(runGit(repoDir, 'rev-parse', 'HEAD') === '7438872d9ac89762608f4b05ef213298eb4b1a50', 'worktree baseline', errors);
check(sha(planBytes) === integrity.familyPlanSha256, 'family plan digest', errors);
check(plan.length === 21 && integrity.sources.length === 21 && dispositions.rows.length === 21, '21-row accounting', errors);
check(sha(logBytes) === integrity.recoveryLogSha256, 'recovery log digest', errors);
check(sha(logBytes) === json(resolve(repoDir, 'artifacts/godskills-completion-20260922/wave12-cache-r1-recovery-assessment.json')).logSha256, 'recovery assessment binding', errors);
const planById = new Map(plan.map((row) => [row.id, row]));
const dispositionById = new Map(dispositions.rows.map((row) => [row.id, row]));
check(planById.size === 21 && dispositionById.size === 21, 'unique plan and dispositions', errors);

for (const source of integrity.sources) {
  const rowErrors = [];
  const planned = planById.get(source.id);
  const intake = index.get(source.sourceId);
  const disposition = dispositionById.get(source.id);
  check(Boolean(planned && intake && disposition), 'plan/intake/disposition presence', rowErrors);
  if (!planned || !intake || !disposition) {
    results.push({ id: source.id, errors: rowErrors });
    errors.push(...rowErrors.map((error) => `${source.id}: ${error}`));
    continue;
  }
  const actualPath = normalized(source.actualResolvedPath);
  const bytes = readFileSync(actualPath);
  const body = bytes.toString('utf8');
  const digest = sha(bytes);
  check(planned.sourceId === source.sourceId && intake.sourceId === source.sourceId, 'source identity', rowErrors);
  check(planned.familyId === source.familyId, 'family', rowErrors);
  check([planned.bodySha256, intake.bodySha256, source.bodySha256, source.actualSha256, disposition.bodySha256].every((value) => value === digest), 'body SHA-256', rowErrors);
  check(bytes.length === source.actualBytes && bytes.length === intake.bytes, 'body bytes', rowErrors);
  check(normalized(resolve(intake.destination, intake.path)) === actualPath, 'resolved acquisition path', rowErrors);
  check(source.pinnedCommit === intake.commit && source.gitBlob === intake.gitBlob, 'pinned commit/blob fields', rowErrors);
  check(runGit(intake.destination, 'rev-parse', 'HEAD') === intake.commit, 'warehouse HEAD', rowErrors);
  check(runGit(intake.destination, 'hash-object', actualPath) === intake.gitBlob, 'current Git blob', rowErrors);
  check(runGit(intake.destination, 'rev-parse', `${intake.commit}:${intake.path}`) === intake.gitBlob, 'pinned tree blob', rowErrors);

  let bodyEvidence;
  if (source.bodyReadEvidence.kind === 'recovered-complete-capture') {
    const ranges = [];
    for (const id of source.bodyReadEvidence.itemIds) {
      const item = logItems.get(id);
      check(Boolean(item), `completed log item ${id}`, rowErrors);
      if (!item) continue;
      check(item.exit_code === 0 && item.status === 'completed', `successful log item ${id}`, rowErrors);
      const capture = JSON.parse(item.aggregated_output);
      check(normalized(capture.path) === actualPath, `log path ${id}`, rowErrors);
      check(capture.sha256 === digest && capture.bytes === bytes.length, `log digest/bytes ${id}`, rowErrors);
      check(capture.totalCharacters === body.length, `log total characters ${id}`, rowErrors);
      check(capture.text === body.slice(capture.characterStart, capture.characterEnd), `log exact body slice ${id}`, rowErrors);
      check(capture.text.length === capture.characterEnd - capture.characterStart, `log range length ${id}`, rowErrors);
      ranges.push([capture.characterStart, capture.characterEnd]);
    }
    ranges.sort((a, b) => a[0] - b[0]);
    let end = 0;
    for (const [start, next] of ranges) {
      check(start <= end, 'body range gap', rowErrors);
      end = Math.max(end, next);
    }
    check(ranges.length > 0 && ranges[0][0] === 0 && end === body.length, 'complete body range union', rowErrors);
    bodyEvidence = { kind: 'recovered-complete-capture', itemIds: source.bodyReadEvidence.itemIds, fullTextMatched: rowErrors.length === 0 };
  } else if (source.bodyReadEvidence.kind === 'prior-exact-body-review') {
    const wave5Line = wave5Review.split(/\r?\n/).find((line) => line.startsWith(`| \`${source.id}\``));
    check(Boolean(wave5Line), 'wave5 source row', rowErrors);
    check(Boolean(wave5Line?.includes(digest)), 'wave5 digest', rowErrors);
    check(Boolean(wave5Line?.includes(source.actualBytes.toLocaleString('en-US'))), 'wave5 bytes', rowErrors);
    bodyEvidence = { kind: 'prior-exact-body-review', wave5RowMatched: Boolean(wave5Line?.includes(digest)), currentBodyReadByProbe: true };
  } else {
    rowErrors.push(`unknown read evidence kind ${source.bodyReadEvidence.kind}`);
  }
  results.push({ id: source.id, familyId: source.familyId, bytes: bytes.length, sha256: digest, bodyEvidence, errors: rowErrors });
  errors.push(...rowErrors.map((error) => `${source.id}: ${error}`));
}

const candidateResults = authorReceipt.candidate.files.map((file) => {
  const actual = sha(readFileSync(resolve(waveDir, file.path)));
  check(actual === file.sha256, `candidate digest ${file.path}`, errors);
  return { path: file.path, sha256: actual, matchesAuthorReceipt: actual === file.sha256 };
});
const ownerResults = authorReceipt.baseline.ownerEntrypoints.map((owner) => {
  const bytes = readFileSync(resolve(repoDir, 'product/skills', owner.id, 'SKILL.md'));
  const digest = sha(bytes);
  check(digest === owner.sha256 && bytes.length === owner.bytes, `owner digest ${owner.id}`, errors);
  return { id: owner.id, bytes: bytes.length, sha256: digest, matchesAuthorReceipt: digest === owner.sha256 && bytes.length === owner.bytes };
});
console.log(JSON.stringify({
  schema: 'wave12-independent-probe-v1',
  baseline: runGit(repoDir, 'rev-parse', 'HEAD'),
  planSha256: sha(planBytes), recoveryLogSha256: sha(logBytes),
  counts: { plan: plan.length, sources: results.length, recoveredCaptures: results.filter((row) => row.bodyEvidence?.kind === 'recovered-complete-capture').length, priorWave5: results.filter((row) => row.bodyEvidence?.kind === 'prior-exact-body-review').length },
  sources: results, candidates: candidateResults, owners: ownerResults,
  errors, passed: errors.length === 0,
  limits: ['Matching captured tool output does not establish that the failed worker consumed it.', 'A wave5 review row attests historical full reading; no independent raw wave5 read log was checked.', 'Hash identity and static review do not establish legal clearance, source correctness, or model performance.'],
}, null, 2));
if (errors.length) process.exitCode = 1;
