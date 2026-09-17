import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { sha256 } from '../src/io.mjs';
import { discoverLocalModuleClosure } from '../src/static-module-closure.mjs';

const ENTRY = 'scripts/verify-effect-only-v2.mjs';
const BUILDER = 'scripts/build-effect-only-verifier-receipt.mjs';
const SOURCES = [ENTRY,'src/effect-intent-v2.mjs','src/intent-contracts.mjs','src/io.mjs','src/routing-contracts.mjs'];
const TESTS = ['tests/effect-only-verifier-cli.test.mjs','tests/effect-only-verifier-receipt.test.mjs'];
const PARENT = Object.freeze({
  path:'receipts/effect-only-executable-v2.json',
  sha256:'f4baee63d9d802f7a985b5570deb81bbf174dbad3d7aea3d3aba67d546851e04',
  receiptDigest:'03fe45aeb133b715354174867a05781fac9b3cfa5353edf020cecdafa1a88a73',
});
const KNOWN_FAILURE = 'installed Codex routing keeps raw capability as the floor and activation evidence-bound';

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
const equal = (a,b) => canonical(a) === canonical(b);

async function containedRead(root, relative) {
  const expected = path.resolve(root,relative);
  const actual = await realpath(expected);
  const identity = p => process.platform === 'win32' ? p.toLowerCase() : p;
  if (identity(actual) !== identity(expected)) throw new Error('receipt artifact is a symlink or noncanonical alias');
  return readFile(actual);
}
async function entry(root, relative) {
  return {path:relative,sha256:sha256(await containedRead(root,relative))};
}

async function observedTests(root, mode, sourceCommit) {
  const logPath = `artifacts/effect-only-verifier-v2/${mode}.log`;
  const bytes = await containedRead(root,logPath);
  if (bytes.length > 65536) throw new Error('test summary log exceeds bound');
  const lines = bytes.toString('utf8').trim().split(/\r?\n/);
  const header = JSON.parse(lines.shift());
  const command = ['node','--test','--test-reporter=spec',...(mode === 'targeted' ? TESTS : [])];
  if (header.format !== 'node-spec-summary-v1' || header.sourceCommit !== sourceCommit ||
      !equal(header.command,command)) throw new Error('test summary invocation/source mismatch');
  const counts = {};
  const failures = new Set();
  for (const line of lines) {
    if (line === '✖ failing tests:') continue;
    const match = /^ℹ (tests|pass|fail|skipped|cancelled|todo) (\d+)$/.exec(line);
    if (match) {
      if (Object.hasOwn(counts,match[1])) throw new Error('duplicate test summary count');
      counts[match[1]] = Number(match[2]);
    } else if (line.startsWith('✖ ')) {
      const failure = /^✖ (.+) \([0-9.]+ms\)$/.exec(line);
      if (!failure) throw new Error('unsupported failure summary line');
      failures.add(failure[1]);
    } else if (!/^ℹ (suites \d+|duration_ms [0-9.]+)$/.test(line)) {
      throw new Error('unexpected test summary content');
    }
  }
  if (Object.keys(counts).length !== 6 || Object.values(counts).some(n => !Number.isSafeInteger(n)) ||
      counts.tests !== counts.pass + counts.fail + counts.skipped + counts.cancelled ||
      counts.tests < 1 || counts.pass < 1 || counts.todo !== 0 || counts.cancelled !== 0 ||
      header.exitCode !== (counts.fail ? 1 : 0)) throw new Error('invalid observed test counts/exit');
  if (mode === 'targeted' && (counts.fail !== 0 || counts.skipped !== 0 || failures.size !== 0)) {
    throw new Error('targeted structural gate did not pass');
  }
  const knownFailures = [];
  if (mode === 'full' && counts.fail) {
    if (counts.fail !== 1 || failures.size !== 1 || !failures.has(KNOWN_FAILURE) || header.baselineReproduced !== true) {
      throw new Error('unresolved nonbaseline full-suite failure');
    }
    knownFailures.push({test:'tests/codex-routing-policy.test.mjs',category:'installed-host-wording',baselineReproduced:true});
  } else if (failures.size !== 0) throw new Error('test failure summary/count disagreement');
  return {...counts,command,logPath,logSha256:sha256(bytes),...(mode === 'full' ? {knownFailures} : {})};
}

/**
 * Builds a structural source manifest from captured evidence. It does not run
 * tests, authenticate reviewer identity, verify Git history, publish a receipt,
 * or adopt a host pin. Those are separate issuer/reviewer gates. sourceCommit
 * must be checked against actual committed source before issuance. A supplied
 * receipt digest is not self-authentication; the host holds a separately trusted
 * digest and executes an isolated snapshot of the verified source bytes.
 */
export async function buildEffectOnlyVerifierReceipt({repositoryRoot,sourceCommit,review}) {
  if (!/^[0-9a-f]{40}$/.test(sourceCommit)) throw new Error('sourceCommit must be exact Git commit');
  if (!review || Object.keys(review).sort().join(',') !== 'disposition,implementationCommit,reviewerTaskId' ||
      review.implementationCommit !== sourceCommit || typeof review.reviewerTaskId !== 'string' ||
      review.reviewerTaskId.trim() === '' || review.disposition !== 'approved-structural-scope') {
    throw new Error('exact source structural review required');
  }
  const root = await realpath(path.resolve(repositoryRoot));
  const parentBytes = await containedRead(root,PARENT.path);
  if (sha256(parentBytes) !== PARENT.sha256) throw new Error('frozen parent receipt file mismatch');
  const parent = JSON.parse(parentBytes);
  const {receiptDigest:parentDigest,...parentBody} = parent;
  if (parentDigest !== PARENT.receiptDigest || sha256(canonical(parentBody)) !== PARENT.receiptDigest) {
    throw new Error('frozen parent logical digest mismatch');
  }
  for (const source of parent.sources) {
    if ((await entry(root,source.path)).sha256 !== source.sha256) throw new Error('parent source bytes changed');
  }
  const closure = await discoverLocalModuleClosure({repositoryRoot:root,roots:[ENTRY]});
  if (!equal(closure.map(s => s.path),SOURCES)) throw new Error('unexpected effect-only executable closure');
  const sources = closure.map(({path:modulePath,sha256:digest}) => ({path:modulePath,sha256:digest}));
  for (const source of sources.slice(1)) {
    if (!parent.sources.some(p => p.path === source.path && p.sha256 === source.sha256)) {
      throw new Error('shared consumer dependency differs from frozen parent');
    }
  }
  const result = {
    schemaVersion:1,
    protocolId:'eternities-godskills-effect-only-verifier-v2',
    status:'verified-structural-only',
    sourceCommit,
    parent:{...PARENT},
    entrypoint:{...sources[0]},
    sources,
    builder:await entry(root,BUILDER),
    tests:await Promise.all(TESTS.map(file => entry(root,file))),
    vectors:await Promise.all([
      ['input','data/effect-only-golden-vector-v2.json'],
      ['result','data/effect-only-result-v2.json'],
    ].map(async ([role,file]) => ({role,...await entry(root,file)}))),
    verification:{
      targeted:await observedTests(root,'targeted',sourceCommit),
      full:await observedTests(root,'full',sourceCommit),
      review:{...review},
    },
    proofLimits:[
      'captured-test-evidence-not-rerun-by-builder',
      'does-not-authenticate-producer-or-reviewer-origin',
      'does-not-certify-model-quality-or-arbitrary-language-understanding',
      'does-not-enable-native-dispatch-or-adopt-host-pins',
      'exit-zero-is-consistency-not-admission-or-effect-authorization',
      'host-must-verify-pinned-source-and-execute-isolated-snapshot',
      'known-full-suite-failure-is-not-a-passing-release-gate',
      'source-commit-membership-is-a-separate-issuance-check',
    ],
  };
  for (const vector of result.vectors) {
    if (!parent.vectors.some(p => p.role === vector.role && p.path === vector.path && p.sha256 === vector.sha256)) {
      throw new Error('verification vector differs from frozen parent');
    }
  }
  return {...result,receiptDigest:sha256(canonical(result))};
}
