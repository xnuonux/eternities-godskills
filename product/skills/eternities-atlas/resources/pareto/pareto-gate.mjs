import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const MAX_INPUT_BYTES = 1_048_576;
const MAX_EVAL_SOURCE_CHARS = 12_000;
const ORACLE_URL = new URL('./pareto-oracle.mjs',import.meta.url);
const VERIFIER_URL = new URL('./verify-output-v1.mjs',import.meta.url);
const PINNED = Object.freeze({
  oracle:'c8688c5c9f2f607c8f024851a74933f784dc6b25db7d81456a24c5951999c18f',
  verifier:'46d3029e3ddb19818e16d46011baa70a6c0c65500fb42cf6774a9a9739b1b4ca',
});
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const hold = reasonCode => ({status:'hold',reasonCode});
const boundary = Object.freeze({
  ownerReviewValidated:false,measurementTruthValidated:false,
  comparabilityValidated:false,hardFeasibilityValidated:false,rightsValidated:false,
});

function childEnvironment() {
  // The exact reviewed source must not be preceded by a caller-supplied Node preload.
  // Builtin-only imports and an absolute process.execPath need no caller PATH/NODE_OPTIONS.
  if (process.platform !== 'win32') return {};
  const environment = {};
  for (const name of ['SystemRoot','WINDIR']) {
    if (process.env[name]) environment[name] = process.env[name];
  }
  return environment;
}

/**
 * Return raw, unverified execution only. Call assessParetoDecision for a checked
 * frontier. Hash and decode one private copy so shared caller memory cannot
 * change the executed source after the digest check.
 */
export function executeReviewedOracleSnapshot(oracleSourceBytes,inputBytes) {
  if (!(oracleSourceBytes instanceof Uint8Array) || oracleSourceBytes.byteLength > MAX_EVAL_SOURCE_CHARS) {
    return hold('reviewed-dependency-mismatch');
  }
  if (!(inputBytes instanceof Uint8Array) || inputBytes.byteLength > MAX_INPUT_BYTES) {
    return hold('invalid-or-oversized-input');
  }
  if (Number(process.versions.node.split('.')[0]) < 24) return hold('unsupported-node-runtime');
  const privateOracleBytes = Buffer.from(oracleSourceBytes);
  const privateInputBytes = Buffer.from(inputBytes);
  if (hash(privateOracleBytes) !== PINNED.oracle) return hold('reviewed-dependency-mismatch');
  let source;
  try {
    source = new TextDecoder('utf-8',{fatal:true}).decode(privateOracleBytes);
  } catch {
    return hold('reviewed-dependency-encoding');
  }
  const invocation = source + '\nawait main();\n';
  if (invocation.length > MAX_EVAL_SOURCE_CHARS) return hold('reviewed-source-eval-limit');

  const run = spawnSync(process.execPath,['--input-type=module','--eval',invocation],{
    input:privateInputBytes,encoding:null,timeout:5_000,maxBuffer:2_097_152,
    windowsHide:true,env:childEnvironment(),
  });
  if (run.error || ![0,2].includes(run.status) || !run.stdout
    || run.stderr?.byteLength !== 0) return hold('oracle-execution-failed');
  return {status:'unverified-execution',verified:false,exitCode:run.status,stdout:run.stdout,stderr:run.stderr};
}

/**
 * Only computes a partition of caller-declared input. There is deliberately no
 * evidenceReview argument or software assertion of an independent owner.
 */
export async function assessParetoDecision({request,frozenInputBytes} = {}) {
  if (request?.kind !== 'frontier') return {status:'excluded',reasonCode:'not-a-frontier-request'};
  if (!(frozenInputBytes instanceof Uint8Array) || frozenInputBytes.byteLength > MAX_INPUT_BYTES) {
    return hold('invalid-or-oversized-input');
  }
  const input = Buffer.from(frozenInputBytes);
  const inputSha256 = hash(input);

  let oracleBytes;
  let verifierBytes;
  try {
    oracleBytes = readFileSync(ORACLE_URL);
    verifierBytes = readFileSync(VERIFIER_URL);
  } catch {
    return hold('missing-reviewed-dependency');
  }
  if (hash(oracleBytes) !== PINNED.oracle || hash(verifierBytes) !== PINNED.verifier) {
    return hold('reviewed-dependency-mismatch');
  }
  const run = executeReviewedOracleSnapshot(oracleBytes,input);
  if (run.status !== 'unverified-execution') return run;

  try {
    // Import the exact already-hashed verifier bytes rather than its path.
    const verifier = await import('data:text/javascript;base64,' + verifierBytes.toString('base64'));
    const verdict = verifier.verifyParetoOutput(input,run.stdout);
    if (verdict.decision === 'ACCEPTED_UNCLASSIFIED_HOLD') return hold('oracle-hold');
    if (run.exitCode !== 0 || verdict.decision !== 'VERIFIED_DECLARED_INPUT_PARTITION') {
      return hold('oracle-verifier-disagreement');
    }
    const output = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(run.stdout));
    return {
      status:'declared-input-frontier',caseId:output.caseId,inputSha256,
      oracleSha256:PINNED.oracle,verifierSha256:PINNED.verifier,
      executionMode:'reviewed-snapshot-node-eval',oracleExitCode:run.exitCode,
      oracleOutputSha256:hash(run.stdout),verifierDecision:verdict.decision,
      frontierIds:output.frontierIds,dominated:output.dominated,
      invalidIds:output.invalidIds,infeasibleIds:output.infeasibleIds,
      eligibleCount:output.eligibleCount,pairChecks:output.pairChecks,
      evidenceBoundary:{...boundary},recommendationAuthorized:false,
    };
  } catch {
    return hold('output-unverified');
  }
}
