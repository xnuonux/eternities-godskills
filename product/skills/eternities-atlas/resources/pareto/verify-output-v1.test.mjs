import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { verifyParetoOutput } from './verify-output-v1.mjs';

const INPUT_SCHEMA = 'pareto-oracle-v2.input.v1';
const OUTPUT_SCHEMA = 'pareto-oracle-v2.output.v1';
const objectiveRows = [
  {id:'A',benefit:5,cost:5},
  {id:'B',benefit:4,cost:3},
  {id:'C',benefit:3,cost:6},
  {id:'TIE',benefit:5,cost:5},
];

function measurement(value, unit) {
  return {value,unit,evidenceTier:'declared-fixture',basisId:'declared-anchor'};
}

function makeInput({rows = objectiveRows, changes = {}} = {}) {
  return {
    schema: INPUT_SCHEMA,
    caseId: 'independent-output-fixture',
    objectives: [
      {key:'benefit',direction:'max',unit:'points',evidenceTier:'declared-fixture',basisId:'declared-anchor'},
      {key:'cost',direction:'min',unit:'credits',evidenceTier:'declared-fixture',basisId:'declared-anchor'},
    ],
    invalidPolicy:'reject-row',
    maxPairChecks: 28,
    rows: [
      ...rows.map(row => ({
        id: row.id,
        feasible: row.feasible ?? true,
        feasibilityEvidenceId: row.feasibilityEvidenceId ?? `declared-${row.id}`,
        measurements: row.measurements ?? {
          benefit: measurement(row.benefit, 'points'),
          cost: measurement(row.cost, 'credits'),
        },
      })),
    ],
    ...changes,
  };
}

function bytes(value) {
  return Buffer.from(JSON.stringify(value), 'utf8');
}

function digest(inputBytes) {
  return createHash('sha256').update(inputBytes).digest('hex');
}

function outputFor(inputBytes, overrides = {}) {
  const input = JSON.parse(inputBytes.toString('utf8'));
  return bytes({
    schema: OUTPUT_SCHEMA,
    inputSha256: digest(inputBytes),
    caseId: input.caseId,
    status:'ok',
    reasonCode:null,
    frontierIds:['A','B','TIE'],
    dominated:[{id:'C',witnessId:'A'}],
    invalidIds:['D'],
    infeasibleIds:['E'],
    eligibleCount:4,
    pairChecks:6,
    ...overrides,
  });
}

const standardInput = () => makeInput({rows:[
  ...objectiveRows,
  {id:'D',measurements:{benefit:measurement(2,'points')}},
  {id:'E',feasible:false,measurements:{benefit:{unchecked:'infeasible rows do not enter numeric comparison'}}},
]});

function expectCode(fn, code) {
  assert.throws(fn, error => error?.code === code, `expected verifier error code ${code}`);
}

test('accepts complete disjoint partition, direct frontier, first retained witness, and exact pair count', () => {
  const inputBytes = bytes(standardInput());
  const verdict = verifyParetoOutput(inputBytes, outputFor(inputBytes));
  assert.equal(verdict.decision, 'VERIFIED_DECLARED_INPUT_PARTITION');
  assert.equal(verdict.verified, true);
  assert.equal(verdict.caseId, 'independent-output-fixture');
  assert.equal(verdict.inputSha256, digest(inputBytes));
  assert.equal(verdict.checks.fullFrontier, true);
  assert.equal(verdict.checks.everyWitness, true);
  assert.equal(verdict.boundary.measurementTruthValidated, false);
  assert.equal(verdict.boundary.feasibilityTruthValidated, false);
});

test('rejects a valid but noncanonical later frontier witness', () => {
  const inputBytes = bytes(standardInput());
  expectCode(() => verifyParetoOutput(inputBytes, outputFor(inputBytes, {
    dominated:[{id:'C',witnessId:'B'}],
  })), 'WITNESS_MISMATCH');
});

test('treats witness object key order as immaterial while requiring both exact witness fields', () => {
  const inputBytes = bytes(standardInput());
  const output = JSON.parse(outputFor(inputBytes).toString('utf8'));
  output.dominated = [{witnessId:'A',id:'C'}];
  const verdict = verifyParetoOutput(inputBytes, bytes(output));
  assert.equal(verdict.checks.everyWitness, true);
});

test('rejects a dominated row offered as a witness instead of a retained frontier row', () => {
  const inputBytes = bytes(makeInput({
    rows:[{id:'P',benefit:3,cost:3},{id:'Q',benefit:2,cost:2},{id:'R',benefit:1,cost:1}],
    changes:{objectives:[{key:'benefit',direction:'max',unit:'points',evidenceTier:'declared-fixture',basisId:'declared-anchor'},
      {key:'cost',direction:'max',unit:'credits',evidenceTier:'declared-fixture',basisId:'declared-anchor'}]},
  }));
  const bad = bytes({schema:OUTPUT_SCHEMA,inputSha256:digest(inputBytes),caseId:'independent-output-fixture',
    status:'ok',reasonCode:null,frontierIds:['P'],dominated:[{id:'Q',witnessId:'P'},{id:'R',witnessId:'Q'}],
    invalidIds:[],infeasibleIds:[],eligibleCount:3,pairChecks:3});
  expectCode(() => verifyParetoOutput(inputBytes, bad), 'WITNESS_MISMATCH');
});

test('rejects an omitted frontier row even when all reported rows otherwise partition', () => {
  const inputBytes = bytes(standardInput());
  expectCode(() => verifyParetoOutput(inputBytes, outputFor(inputBytes, {
    frontierIds:['A','B'],
  })), 'FRONTIER_MISMATCH');
});

test('rejects duplicate, overlapping, missing, and invented row identities', () => {
  const inputBytes = bytes(standardInput());
  for (const overrides of [
    {frontierIds:['A','B','TIE','TIE']},
    {invalidIds:['D','A']},
    {infeasibleIds:[]},
    {frontierIds:['A','B','TIE','NO-SUCH-ROW']},
  ]) {
    expectCode(() => verifyParetoOutput(inputBytes, outputFor(inputBytes, overrides)), 'PARTITION_MISMATCH');
  }
});

test('rejects omitted, changed, or duplicate dominated identities', () => {
  const inputBytes = bytes(standardInput());
  for (const dominated of [[],[{id:'C',witnessId:'A'},{id:'C',witnessId:'A'}],[{id:'OTHER',witnessId:'A'}]]) {
    expectCode(() => verifyParetoOutput(inputBytes, outputFor(inputBytes, {dominated})), 'PARTITION_MISMATCH');
  }
});

test('checks reported pair count and eligible count instead of trusting either', () => {
  const inputBytes = bytes(standardInput());
  expectCode(() => verifyParetoOutput(inputBytes, outputFor(inputBytes, {pairChecks:5})), 'PAIR_COUNT_MISMATCH');
  expectCode(() => verifyParetoOutput(inputBytes, outputFor(inputBytes, {eligibleCount:3})), 'ELIGIBLE_COUNT_MISMATCH');
});

test('binds the exact frozen bytes and case identity, including whitespace changes', () => {
  const original = bytes(standardInput());
  const accepted = outputFor(original);
  const changedBytes = Buffer.concat([original, Buffer.from('\n')]);
  expectCode(() => verifyParetoOutput(changedBytes, accepted), 'INPUT_DIGEST_MISMATCH');
  expectCode(() => verifyParetoOutput(original, outputFor(original, {caseId:'different-case'})), 'CASE_ID_MISMATCH');
});

test('rejects malformed output schema, extra fields, and wrong field types', () => {
  const inputBytes = bytes(standardInput());
  for (const overrides of [
    {schema:'pareto-oracle-v9.output.v1'},
    {winnerId:'A'},
    {frontierIds:'A,B,TIE'},
    {reasonCode:'not-null-on-ok'},
  ]) {
    expectCode(() => verifyParetoOutput(inputBytes, outputFor(inputBytes, overrides)), 'OUTPUT_SCHEMA');
  }
});

test('rejects missing input identity even if the caller recomputes the matching byte digest', () => {
  const malformed = standardInput();
  delete malformed.rows[0].id;
  const inputBytes = bytes(malformed);
  expectCode(() => verifyParetoOutput(inputBytes, outputFor(inputBytes)), 'INPUT_SCHEMA');
});

test('rejects input schema substitution before evaluating a declared partition', () => {
  const malformed = standardInput();
  malformed.schema = 'pareto-oracle-v3.input.v1';
  const inputBytes = bytes(malformed);
  expectCode(() => verifyParetoOutput(inputBytes, outputFor(inputBytes)), 'INPUT_SCHEMA');
});

test('rejects duplicate JSON keys, including escaped aliases, in either byte stream', () => {
  const good = bytes(standardInput());
  const inputDuplicate = Buffer.from('{"schema":"pareto-oracle-v2.input.v1","caseId":"x","case\\u0049d":"y"}');
  expectCode(() => verifyParetoOutput(inputDuplicate, outputFor(good)), 'DUPLICATE_JSON_KEY');

  const output = outputFor(good).toString('utf8');
  const outputDuplicate = Buffer.from(output.replace('"status":"ok"', '"status":"hold","sta\\u0074us":"ok"'));
  expectCode(() => verifyParetoOutput(good, outputDuplicate), 'DUPLICATE_JSON_KEY');
});

test('accepts only a structurally empty hold and does not claim its reason is verified', () => {
  const inputBytes = bytes({...standardInput(),invalidPolicy:undefined});
  const hold = bytes({schema:OUTPUT_SCHEMA,inputSha256:digest(inputBytes),caseId:'independent-output-fixture',
    status:'hold',reasonCode:'invalid-policy-undeclared',frontierIds:[],dominated:[],invalidIds:[],
    infeasibleIds:[],eligibleCount:null,pairChecks:0});
  const verdict = verifyParetoOutput(inputBytes, hold);
  assert.equal(verdict.decision, 'ACCEPTED_UNCLASSIFIED_HOLD');
  assert.equal(verdict.checks.holdReasonValidated, false);
  expectCode(() => verifyParetoOutput(inputBytes, bytes({
    ...JSON.parse(hold.toString('utf8')),frontierIds:['A'],
  })), 'HOLD_SHAPE');
});

test('rejects ok classifications when the declared invalid policy or pair budget requires a hold', () => {
  const invalidPolicyInput = standardInput();
  invalidPolicyInput.invalidPolicy = 'hold';
  const invalidBytes = bytes(invalidPolicyInput);
  expectCode(() => verifyParetoOutput(invalidBytes, outputFor(invalidBytes)), 'INPUT_NOT_CLASSIFIABLE');

  const pairBudgetInput = standardInput();
  pairBudgetInput.maxPairChecks = 5;
  const pairBudgetBytes = bytes(pairBudgetInput);
  expectCode(() => verifyParetoOutput(pairBudgetBytes, outputFor(pairBudgetBytes)), 'INPUT_NOT_CLASSIFIABLE');
});

test('a declared feasible flag and fabricated nonempty evidence identifier remain unverified assertions', () => {
  const input = makeInput({rows:[
    {id:'DECLARED-YES',benefit:2,cost:2,feasibilityEvidenceId:'invented:hard-gate-proof'},
    {id:'DECLARED-NO',feasible:false,feasibilityEvidenceId:'invented:failed-gate-proof',
      measurements:{benefit:{any:'shape allowed only because row is declared infeasible'}}},
  ]});
  const inputBytes = bytes(input);
  const output = bytes({schema:OUTPUT_SCHEMA,inputSha256:digest(inputBytes),caseId:input.caseId,status:'ok',
    reasonCode:null,frontierIds:['DECLARED-YES'],dominated:[],invalidIds:[],
    infeasibleIds:['DECLARED-NO'],eligibleCount:1,pairChecks:0});
  const verdict = verifyParetoOutput(inputBytes, output);
  assert.equal(verdict.decision, 'VERIFIED_DECLARED_INPUT_PARTITION');
  assert.equal(verdict.boundary.feasibilityTruthValidated, false);
});

test('does not infer truth from generated matching labels or a declared feasible flag', () => {
  const assertedOnly = standardInput();
  assertedOnly.objectives = [
    {key:'benefit',direction:'max',unit:'agent-made-unit',evidenceTier:'agent-made-tier',basisId:'agent-made-basis'},
    {key:'cost',direction:'min',unit:'agent-made-cost-unit',evidenceTier:'agent-made-tier',basisId:'agent-made-basis'},
  ];
  const relabelled = assertedOnly.rows.map(row => ({...row,measurements:Object.fromEntries(
    Object.entries(row.measurements).map(([key,measurementValue]) => [key,{...measurementValue,
      unit:key === 'benefit' ? 'agent-made-unit' : 'agent-made-cost-unit',
      evidenceTier:'agent-made-tier',basisId:'agent-made-basis'}]),
  )}));
  assertedOnly.rows = relabelled;
  const inputBytes = bytes(assertedOnly);
  const verdict = verifyParetoOutput(inputBytes, outputFor(inputBytes));
  assert.equal(verdict.decision, 'VERIFIED_DECLARED_INPUT_PARTITION');
  assert.equal(verdict.boundary.labelTruthValidated, false);
  assert.equal(verdict.boundary.feasibilityTruthValidated, false);
});

test('rejects an internally self-consistent output when a row was omitted from the partition after identity change', () => {
  const changed = standardInput();
  changed.rows[0].id = 'RENAMED';
  const inputBytes = bytes(changed);
  expectCode(() => verifyParetoOutput(inputBytes, outputFor(inputBytes)), 'PARTITION_MISMATCH');
});

test('rejects invalid UTF-8, malformed JSON, and inputs exceeding the byte bound', () => {
  expectCode(() => verifyParetoOutput(Buffer.from([0xc3,0x28]), Buffer.from('{}')), 'INPUT_UTF8');
  expectCode(() => verifyParetoOutput(Buffer.from('{bad'), Buffer.from('{}')), 'INPUT_JSON');
  expectCode(() => verifyParetoOutput(Buffer.alloc(1_048_577, 0x20), Buffer.from('{}')), 'INPUT_TOO_LARGE');
  expectCode(() => verifyParetoOutput(bytes(standardInput()), Buffer.alloc(1_048_577, 0x20)), 'OUTPUT_TOO_LARGE');
});
