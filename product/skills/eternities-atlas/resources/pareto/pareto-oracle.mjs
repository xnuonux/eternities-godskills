import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const INPUT_SCHEMA = 'pareto-oracle-v2.input.v1';
const OUTPUT_SCHEMA = 'pareto-oracle-v2.output.v1';
const MAX_BYTES = 1024 * 1024;
const MAX_ROWS = 300;
const MAX_OBJECTIVES = 16;
const MAX_PAIR_CHECKS = MAX_ROWS * (MAX_ROWS - 1) / 2;
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;
const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const exactKeys = (value, names) => record(value) && Object.keys(value).length === names.length
  && names.every(name => has(value, name));
const label = value => typeof value === 'string' && value.trim().length > 0;

function result(caseId, status, reasonCode, frontierIds = [], dominated = [], invalidIds = [],
  infeasibleIds = [], eligibleCount = null, pairChecks = 0) {
  return {schema: OUTPUT_SCHEMA,caseId,status,reasonCode,frontierIds,dominated,invalidIds,
    infeasibleIds,eligibleCount,pairChecks};
}
const hold = (caseId, reasonCode) => result(caseId, 'hold', reasonCode);

// Returns 1 if a dominates b, -1 if b dominates a, or 0 for a trade-off/equality.
function relation(a, b, objectives) {
  let aStrict = false;
  let bStrict = false;
  for (const objective of objectives) {
    const x = a.measurements[objective.key].value;
    const y = b.measurements[objective.key].value;
    if (x === y) continue;
    const aBetter = objective.direction === 'max' ? x > y : x < y;
    if (aBetter) aStrict = true;
    else bStrict = true;
    if (aStrict && bStrict) return 0;
  }
  return aStrict ? 1 : bStrict ? -1 : 0;
}

// JSON.parse keeps the final value of a repeated object key. Scan the valid
// JSON text first so that no overwritten measurement can enter evaluation.
function hasDuplicateJsonKeys(source) {
  const stack = [];
  for (let i = 0; i < source.length; i++) {
    const token = source[i];
    if (token === '"') {
      let end = i + 1;
      for (; end < source.length; end++) {
        if (source[end] === '\\') end++;
        else if (source[end] === '"') break;
      }
      const frame = stack.at(-1);
      if (frame?.kind === 'object' && frame.expectKey) {
        const key = JSON.parse(source.slice(i, end + 1));
        if (frame.keys.has(key)) return true;
        frame.keys.add(key);
        frame.expectKey = false;
      }
      i = end;
    } else if (token === '{') stack.push({kind:'object',keys:new Set(),expectKey:true});
    else if (token === '[') stack.push({kind:'array'});
    else if (token === '}' || token === ']') stack.pop();
    else if (token === ',' && stack.at(-1)?.kind === 'object') stack.at(-1).expectKey = true;
  }
  return false;
}

export function evaluate(input) {
  const caseId = record(input) && typeof input.caseId === 'string' && ID.test(input.caseId)
    ? input.caseId : null;
  if (!record(input) || input.schema !== INPUT_SCHEMA || caseId === null) return hold(caseId, 'invalid-schema');
  const topKeys = ['schema','caseId','objectives','rows','invalidPolicy','maxPairChecks'];
  const presentKeys = Object.keys(input);
  if (presentKeys.some(key => !topKeys.includes(key))
    || topKeys.filter(key => key !== 'invalidPolicy').some(key => !has(input, key))) {
    return hold(caseId, 'invalid-schema');
  }
  if (!has(input, 'invalidPolicy') || input.invalidPolicy === 'undeclared') {
    return hold(caseId, 'invalid-policy-undeclared');
  }
  if (input.invalidPolicy !== 'hold' && input.invalidPolicy !== 'reject-row') {
    return hold(caseId, 'invalid-policy-invalid');
  }
  if (!Array.isArray(input.objectives) || input.objectives.length < 2
    || input.objectives.length > MAX_OBJECTIVES) return hold(caseId, 'invalid-objective');
  const objectiveKeys = new Set();
  for (const objective of input.objectives) {
    if (!exactKeys(objective, ['key','direction','unit','evidenceTier','basisId'])
      || typeof objective.key !== 'string' || !ID.test(objective.key)
      || objectiveKeys.has(objective.key)
      || (objective.direction !== 'max' && objective.direction !== 'min')
      || !label(objective.unit) || !label(objective.evidenceTier) || !label(objective.basisId)) {
      return hold(caseId, 'invalid-objective');
    }
    objectiveKeys.add(objective.key);
  }
  if (!Array.isArray(input.rows)) return hold(caseId, 'invalid-schema');
  if (input.rows.length > MAX_ROWS) return hold(caseId, 'row-limit-exceeded');
  if (!Number.isInteger(input.maxPairChecks) || input.maxPairChecks < 0
    || input.maxPairChecks > MAX_PAIR_CHECKS) return hold(caseId, 'invalid-pair-budget');

  const rowIds = new Set();
  for (const row of input.rows) {
    if (!record(row) || typeof row.id !== 'string' || !ID.test(row.id)) {
      return hold(caseId, 'invalid-row-id');
    }
    if (rowIds.has(row.id)) return hold(caseId, 'duplicate-row-id');
    rowIds.add(row.id);
    if (!exactKeys(row, ['id','feasible','feasibilityEvidenceId','measurements'])
      || typeof row.feasible !== 'boolean' || !label(row.feasibilityEvidenceId)) {
      return hold(caseId, 'invalid-feasibility');
    }
    if (!record(row.measurements)) return hold(caseId, 'invalid-schema');
    if (Object.keys(row.measurements).some(key => !objectiveKeys.has(key))) {
      return hold(caseId, 'invalid-measurement-schema');
    }
  }

  const eligible = [];
  const invalidIds = [];
  const infeasibleIds = [];
  for (const row of input.rows) {
    if (!row.feasible) {
      infeasibleIds.push(row.id);
      continue;
    }
    let invalid = false;
    for (const objective of input.objectives) {
      const measurement = row.measurements[objective.key];
      if (measurement === undefined || measurement === null) {
        invalid = true;
        continue;
      }
      if (!record(measurement)) return hold(caseId, 'invalid-measurement-schema');
      const complete = exactKeys(measurement, ['value','unit','evidenceTier','basisId']);
      const valueAbsent = exactKeys(measurement, ['unit','evidenceTier','basisId']);
      if (!complete && !valueAbsent) return hold(caseId, 'invalid-measurement-schema');
      if (measurement.unit !== objective.unit || measurement.evidenceTier !== objective.evidenceTier
        || measurement.basisId !== objective.basisId) return hold(caseId, 'measurement-not-comparable');
      if (valueAbsent) {
        invalid = true;
        continue;
      }
      const value = measurement.value;
      if (typeof value !== 'number' || !Number.isFinite(value)
        || (Number.isInteger(value) && !Number.isSafeInteger(value))) invalid = true;
    }
    if (invalid) {
      if (input.invalidPolicy === 'hold') return hold(caseId, 'invalid-measurement');
      invalidIds.push(row.id);
    } else eligible.push(row);
  }

  const n = eligible.length;
  const needed = n * (n - 1) / 2;
  if (needed > input.maxPairChecks) return hold(caseId, 'pair-budget-exceeded');
  const dominators = Array.from({length:n}, () => new Set());
  let pairChecks = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const relationCode = relation(eligible[i], eligible[j], input.objectives);
      pairChecks++;
      if (relationCode === 1) dominators[j].add(i);
      else if (relationCode === -1) dominators[i].add(j);
    }
  }
  const frontierIndexes = [];
  for (let i = 0; i < n; i++) if (dominators[i].size === 0) frontierIndexes.push(i);
  const frontierIds = frontierIndexes.map(i => eligible[i].id);
  const dominated = [];
  for (let i = 0; i < n; i++) {
    if (dominators[i].size === 0) continue;
    const witnessIndex = frontierIndexes.find(j => dominators[i].has(j));
    if (witnessIndex === undefined) return hold(caseId, 'internal-witness-failure');
    dominated.push({id:eligible[i].id,witnessId:eligible[witnessIndex].id});
  }
  if (frontierIds.length + dominated.length + invalidIds.length + infeasibleIds.length !== input.rows.length
    || pairChecks !== needed) return hold(caseId, 'internal-partition-failure');
  return result(caseId, 'ok', null, frontierIds, dominated, invalidIds, infeasibleIds, n, pairChecks);
}

async function readBoundedRaw(filename) {
  const stream = filename ? createReadStream(filename) : process.stdin;
  const digest = createHash('sha256');
  const chunks = [];
  let bytes = 0;
  for await (const chunk of stream) {
    digest.update(chunk);
    bytes += chunk.length;
    if (bytes <= MAX_BYTES) chunks.push(chunk);
  }
  return {raw:bytes <= MAX_BYTES ? Buffer.concat(chunks) : null,sha256:digest.digest('hex')};
}

async function main() {
  let inputSha256 = null;
  let answer;
  try {
    if (process.argv.length > 3) answer = hold(null, 'invalid-invocation');
    else {
      const read = await readBoundedRaw(process.argv[2]);
      inputSha256 = read.sha256;
      if (read.raw === null) answer = hold(null, 'input-too-large');
      else {
        let parsed;
        try {
          const source = new TextDecoder('utf-8', {fatal:true}).decode(read.raw);
          parsed = JSON.parse(source);
          if (hasDuplicateJsonKeys(source)) answer = hold(null, 'duplicate-json-key');
        }
        catch { answer = hold(null, 'invalid-json'); }
        if (answer === undefined) answer = evaluate(parsed);
      }
    }
  } catch { answer = hold(null, 'input-read-error'); }
  const output = {schema:answer.schema,inputSha256,caseId:answer.caseId,status:answer.status,
    reasonCode:answer.reasonCode,frontierIds:answer.frontierIds,dominated:answer.dominated,
    invalidIds:answer.invalidIds,infeasibleIds:answer.infeasibleIds,
    eligibleCount:answer.eligibleCount,pairChecks:answer.pairChecks};
  process.stdout.write(JSON.stringify(output) + '\n');
  process.exitCode = answer.status === 'ok' ? 0 : 2;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
