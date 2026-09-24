import { createHash } from 'node:crypto';

const INPUT_SCHEMA = 'pareto-oracle-v2.input.v1';
const OUTPUT_SCHEMA = 'pareto-oracle-v2.output.v1';
const MAX_BYTES = 1_048_576;
const MAX_ROWS = 300;
const MAX_OBJECTIVES = 16;
const MAX_PAIRS = MAX_ROWS * (MAX_ROWS - 1) / 2;
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;
const INPUT_KEYS = ['schema','caseId','objectives','rows','invalidPolicy','maxPairChecks'];
const OUTPUT_KEYS = ['schema','inputSha256','caseId','status','reasonCode','frontierIds','dominated',
  'invalidIds','infeasibleIds','eligibleCount','pairChecks'];

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const has = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const isLabel = value => typeof value === 'string' && value.trim().length > 0;

export class OutputVerificationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'OutputVerificationError';
    this.code = code;
  }
}

function fail(code, message) {
  throw new OutputVerificationError(code, message);
}

function exactRecord(value, expectedKeys) {
  if (!isRecord(value)) return false;
  const actual = Object.keys(value);
  return actual.length === expectedKeys.length && expectedKeys.every(key => has(value, key));
}

function decodeJson(raw, label) {
  if (!(raw instanceof Uint8Array)) fail(`${label}_BYTES`, `${label.toLowerCase()} must be bytes`);
  if (raw.byteLength > MAX_BYTES) fail(`${label}_TOO_LARGE`, `${label.toLowerCase()} exceeds the 1 MiB bound`);
  let text;
  try {
    text = new TextDecoder('utf-8', {fatal:true}).decode(raw);
  } catch {
    fail(`${label}_UTF8`, `${label.toLowerCase()} is not valid UTF-8`);
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    fail(`${label}_JSON`, `${label.toLowerCase()} is not valid JSON`);
  }
  if (containsRepeatedMemberName(text)) fail('DUPLICATE_JSON_KEY', 'duplicate decoded JSON object member name');
  return {parsed,text};
}

// JSON.parse validates syntax first. This separate structural walk decodes each
// member name, so escaped aliases such as "x" and "\u0078" collide.
function containsRepeatedMemberName(text) {
  let cursor = 0;
  const whitespace = () => {
    while (cursor < text.length && /[\u0009\u000a\u000d\u0020]/.test(text[cursor])) cursor++;
  };
  const stringToken = () => {
    const start = cursor++;
    while (cursor < text.length) {
      const char = text[cursor++];
      if (char === '\\') cursor++;
      else if (char === '"') return JSON.parse(text.slice(start, cursor));
    }
    fail('JSON_SCAN', 'unterminated JSON string during member scan');
  };
  const value = depth => {
    if (depth > 512) fail('JSON_DEPTH', 'JSON nesting exceeds verifier bound');
    whitespace();
    const char = text[cursor];
    if (char === '"') {
      stringToken();
      return;
    }
    if (char === '{') {
      cursor++;
      whitespace();
      const names = new Set();
      if (text[cursor] === '}') {
        cursor++;
        return;
      }
      while (cursor < text.length) {
        whitespace();
        const name = stringToken();
        if (names.has(name)) return true;
        names.add(name);
        whitespace();
        cursor++; // JSON.parse already established the required colon.
        if (value(depth + 1)) return true;
        whitespace();
        if (text[cursor] === '}') {
          cursor++;
          return false;
        }
        cursor++; // JSON.parse already established the required comma.
      }
      return false;
    }
    if (char === '[') {
      cursor++;
      whitespace();
      if (text[cursor] === ']') {
        cursor++;
        return false;
      }
      while (cursor < text.length) {
        if (value(depth + 1)) return true;
        whitespace();
        if (text[cursor] === ']') {
          cursor++;
          return false;
        }
        cursor++; // JSON.parse already established the required comma.
      }
      return false;
    }
    while (cursor < text.length && !/[\u0009\u000a\u000d\u0020,\]}]/.test(text[cursor])) cursor++;
    return false;
  };
  return value(0);
}

function hash(raw) {
  return createHash('sha256').update(raw).digest('hex');
}

function checkInputEnvelope(input) {
  if (!isRecord(input) || input.schema !== INPUT_SCHEMA
    || typeof input.caseId !== 'string' || !ID.test(input.caseId)) {
    fail('INPUT_SCHEMA', 'input schema or case identity is invalid');
  }
}

function checkInputForOk(input) {
  const required = INPUT_KEYS.filter(key => key !== 'invalidPolicy');
  if (Object.keys(input).some(key => !INPUT_KEYS.includes(key))
    || required.some(key => !has(input, key))) {
    fail('INPUT_SCHEMA', 'input has missing or unknown top-level fields');
  }
  if (input.invalidPolicy !== 'hold' && input.invalidPolicy !== 'reject-row') {
    fail('INPUT_SCHEMA', 'an ok result requires a declared invalid-row policy');
  }
  if (!Array.isArray(input.objectives) || input.objectives.length < 2
    || input.objectives.length > MAX_OBJECTIVES) {
    fail('INPUT_SCHEMA', 'objective count is outside the supported finite contract');
  }
  const objectiveKeys = new Set();
  for (const objective of input.objectives) {
    if (!exactRecord(objective, ['key','direction','unit','evidenceTier','basisId'])
      || typeof objective.key !== 'string' || !ID.test(objective.key)
      || objectiveKeys.has(objective.key)
      || (objective.direction !== 'max' && objective.direction !== 'min')
      || !isLabel(objective.unit) || !isLabel(objective.evidenceTier) || !isLabel(objective.basisId)) {
      fail('INPUT_SCHEMA', 'objective declaration is malformed or duplicated');
    }
    objectiveKeys.add(objective.key);
  }
  if (!Array.isArray(input.rows) || input.rows.length > MAX_ROWS
    || !Number.isInteger(input.maxPairChecks) || input.maxPairChecks < 0 || input.maxPairChecks > MAX_PAIRS) {
    fail('INPUT_SCHEMA', 'row collection or comparison budget is outside the bounded contract');
  }

  const rowIds = new Set();
  for (const row of input.rows) {
    if (!isRecord(row) || typeof row.id !== 'string' || !ID.test(row.id) || rowIds.has(row.id)
      || !exactRecord(row, ['id','feasible','feasibilityEvidenceId','measurements'])
      || typeof row.feasible !== 'boolean' || !isLabel(row.feasibilityEvidenceId)
      || !isRecord(row.measurements)
      || Object.keys(row.measurements).some(key => !objectiveKeys.has(key))) {
      fail('INPUT_SCHEMA', 'row identity, feasibility declaration, or measurement map is malformed');
    }
    rowIds.add(row.id);
  }
  return [...objectiveKeys];
}

function readMeasurement(measurement, objective) {
  if (measurement === undefined || measurement === null) return {invalid:true};
  if (!isRecord(measurement)) fail('INPUT_SCHEMA', 'measurement entry is not an object');
  const complete = exactRecord(measurement, ['value','unit','evidenceTier','basisId']);
  const valueOmitted = exactRecord(measurement, ['unit','evidenceTier','basisId']);
  if (!complete && !valueOmitted) fail('INPUT_SCHEMA', 'measurement entry has missing or unknown fields');
  if (measurement.unit !== objective.unit || measurement.evidenceTier !== objective.evidenceTier
    || measurement.basisId !== objective.basisId) {
    fail('INPUT_NOT_COMPARABLE', 'input metadata does not match its own objective declaration');
  }
  if (valueOmitted) return {invalid:true};
  const numeric = measurement.value;
  if (typeof numeric !== 'number' || !Number.isFinite(numeric)
    || (Number.isInteger(numeric) && !Number.isSafeInteger(numeric))) return {invalid:true};
  return {invalid:false,value:numeric};
}

function deriveDeclaredRows(input) {
  const objectiveByKey = new Map(input.objectives.map(objective => [objective.key, objective]));
  const eligible = [];
  const invalidIds = [];
  const infeasibleIds = [];

  for (const row of input.rows) {
    if (!row.feasible) {
      infeasibleIds.push(row.id);
      continue;
    }
    let invalid = false;
    const values = Object.create(null);
    for (const objective of input.objectives) {
      const measured = readMeasurement(row.measurements[objective.key], objective);
      if (measured.invalid) invalid = true;
      else values[objective.key] = measured.value;
    }
    if (invalid) {
      if (input.invalidPolicy === 'hold') fail('INPUT_NOT_CLASSIFIABLE', 'invalid measurements require a whole-case hold');
      invalidIds.push(row.id);
    } else eligible.push({id:row.id,values});
  }
  const pairCount = eligible.length * (eligible.length - 1) / 2;
  if (pairCount > input.maxPairChecks) fail('INPUT_NOT_CLASSIFIABLE', 'declared pair budget requires a hold');
  return {eligible,invalidIds,infeasibleIds,pairCount};
}

function dominates(candidate, target, objectives) {
  let strictlyBetter = false;
  for (const objective of objectives) {
    const left = candidate.values[objective.key];
    const right = target.values[objective.key];
    if (left === right) continue;
    const better = objective.direction === 'max' ? left > right : left < right;
    if (!better) return false;
    strictlyBetter = true;
  }
  return strictlyBetter;
}

function deriveDirectFrontier(eligible, objectives) {
  const frontier = [];
  const dominated = [];
  for (let targetIndex = 0; targetIndex < eligible.length; targetIndex++) {
    const target = eligible[targetIndex];
    let hasAnyDominator = false;
    for (let candidateIndex = 0; candidateIndex < eligible.length; candidateIndex++) {
      if (candidateIndex !== targetIndex && dominates(eligible[candidateIndex], target, objectives)) {
        hasAnyDominator = true;
        break;
      }
    }
    if (!hasAnyDominator) frontier.push(target);
    else dominated.push(target);
  }

  const witnessed = dominated.map(target => {
    const witness = frontier.find(candidate => dominates(candidate, target, objectives));
    if (!witness) fail('INTERNAL_FRONTIER', 'direct dominance check found no retained frontier witness');
    return {id:target.id,witnessId:witness.id};
  });
  return {frontierIds:frontier.map(row => row.id),dominated:witnessed};
}

function requireArrayOfStrings(value) {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function verifyHold(output, input, expectedDigest) {
  if (output.status !== 'hold' || !isLabel(output.reasonCode)
    || !Array.isArray(output.frontierIds) || output.frontierIds.length !== 0
    || !Array.isArray(output.dominated) || output.dominated.length !== 0
    || !Array.isArray(output.invalidIds) || output.invalidIds.length !== 0
    || !Array.isArray(output.infeasibleIds) || output.infeasibleIds.length !== 0
    || output.eligibleCount !== null || output.pairChecks !== 0) {
    fail('HOLD_SHAPE', 'hold outputs must carry no row classification, count, or pair work');
  }
  return {
    decision:'ACCEPTED_UNCLASSIFIED_HOLD',
    verified:true,
    caseId:input.caseId,
    inputSha256:expectedDigest,
    checks:{inputDigest:true,inputSchema:true,outputSchema:true,emptyClassifications:true,holdReasonValidated:false},
    boundary:{measurementTruthValidated:false,feasibilityTruthValidated:false,labelTruthValidated:false,
      holdReasonMeaningValidated:false,rightsOrDomainSuitabilityValidated:false},
  };
}

/**
 * Verify a v3-compatible oracle output against the exact caller-frozen input bytes.
 * This checks only declared data and never authenticates evidence, labels, or feasibility.
 */
export function verifyParetoOutput(inputBytes, outputBytes) {
  const inputDecoded = decodeJson(inputBytes, 'INPUT');
  const outputDecoded = decodeJson(outputBytes, 'OUTPUT');
  const input = inputDecoded.parsed;
  const output = outputDecoded.parsed;
  const exactDigest = hash(inputBytes);

  checkInputEnvelope(input);
  if (!exactRecord(output, OUTPUT_KEYS) || output.schema !== OUTPUT_SCHEMA
    || typeof output.inputSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(output.inputSha256)
    || (output.status !== 'ok' && output.status !== 'hold')) {
    fail('OUTPUT_SCHEMA', 'output schema or exact top-level fields are invalid');
  }
  if (output.inputSha256 !== exactDigest) fail('INPUT_DIGEST_MISMATCH', 'output is not bound to these exact input bytes');
  if (output.caseId !== input.caseId) fail('CASE_ID_MISMATCH', 'output case identity differs from the frozen input');
  if (output.status === 'hold') return verifyHold(output, input, exactDigest);

  if (output.reasonCode !== null || !requireArrayOfStrings(output.frontierIds)
    || !Array.isArray(output.dominated)
    || !output.dominated.every(item => exactRecord(item, ['id','witnessId'])
      && typeof item.id === 'string' && typeof item.witnessId === 'string')
    || !requireArrayOfStrings(output.invalidIds) || !requireArrayOfStrings(output.infeasibleIds)
    || !Number.isInteger(output.eligibleCount) || output.eligibleCount < 0
    || !Number.isInteger(output.pairChecks) || output.pairChecks < 0) {
    fail('OUTPUT_SCHEMA', 'ok output contains malformed fields or non-null reason code');
  }

  const objectiveKeys = checkInputForOk(input);
  // Recover objective order from the already-validated caller declaration.
  if (objectiveKeys.length !== input.objectives.length) fail('INPUT_SCHEMA', 'objective key set is inconsistent');
  const declared = deriveDeclaredRows(input);
  const computed = deriveDirectFrontier(declared.eligible, input.objectives);

  const reportedIds = [
    ...output.frontierIds,
    ...output.dominated.map(item => item.id),
    ...output.invalidIds,
    ...output.infeasibleIds,
  ];
  const rowIds = new Set(input.rows.map(row => row.id));
  if (new Set(reportedIds).size !== reportedIds.length || reportedIds.some(id => !rowIds.has(id))) {
    fail('PARTITION_MISMATCH', 'output repeats or invents a row identity');
  }
  if (JSON.stringify(output.frontierIds) !== JSON.stringify(computed.frontierIds)) {
    fail('FRONTIER_MISMATCH', 'reported frontier is incomplete, extra, or out of input order');
  }
  const expectedDominatedIds = computed.dominated.map(item => item.id);
  if (JSON.stringify(output.dominated.map(item => item.id)) !== JSON.stringify(expectedDominatedIds)
    || JSON.stringify(output.invalidIds) !== JSON.stringify(declared.invalidIds)
    || JSON.stringify(output.infeasibleIds) !== JSON.stringify(declared.infeasibleIds)) {
    fail('PARTITION_MISMATCH', 'output classes do not exactly match the declared rows in input order');
  }
  if (reportedIds.length !== input.rows.length) fail('PARTITION_MISMATCH', 'output classes omit one or more input rows');
  if (output.dominated.some((item, index) => item.id !== computed.dominated[index].id
    || item.witnessId !== computed.dominated[index].witnessId)) {
    fail('WITNESS_MISMATCH', 'a dominated row lacks the first retained direct frontier witness');
  }
  if (output.eligibleCount !== declared.eligible.length) fail('ELIGIBLE_COUNT_MISMATCH', 'eligibleCount does not match the partition');
  if (output.pairChecks !== declared.pairCount) fail('PAIR_COUNT_MISMATCH', 'pairChecks does not match the unordered eligible-pair count');

  return {
    decision:'VERIFIED_DECLARED_INPUT_PARTITION',
    verified:true,
    caseId:input.caseId,
    inputSha256:exactDigest,
    checks:{inputDigest:true,inputSchema:true,outputSchema:true,disjointCompletePartition:true,
      fullFrontier:true,everyWitness:true,eligibleCount:true,pairCount:true},
    boundary:{measurementTruthValidated:false,feasibilityTruthValidated:false,labelTruthValidated:false,
      rightsOrDomainSuitabilityValidated:false,independentFromOracleImplementation:true},
  };
}
