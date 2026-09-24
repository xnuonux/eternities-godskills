import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const oracle = path.join(here, 'pareto-oracle.mjs');
const frozenPath = path.join(here, 'frozen-independent-fixtures.json');
const frozenBytes = readFileSync(frozenPath);
assert.equal(createHash('sha256').update(frozenBytes).digest('hex'),
  '62460bdc01a6e808a09463795178a9f6ff7abfc619e436897dddc60d38c75add',
  'independently authored fixture drift');
const frozenCases = new Map(JSON.parse(frozenBytes).cases.map(row => [row.caseId, row]));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const outputKeys = ['schema','inputSha256','caseId','status','reasonCode','frontierIds','dominated',
  'invalidIds','infeasibleIds','eligibleCount','pairChecks'];

function runRaw(raw, expectedExit) {
  const call = spawnSync(process.execPath, [oracle], { input: raw, encoding: 'utf8', timeout: 5000,
    maxBuffer: 2 * 1024 * 1024 });
  assert.equal(call.error, undefined, `oracle process error: ${call.error}`);
  assert.equal(call.status, expectedExit, `oracle exit ${call.status}; stderr=${call.stderr}`);
  assert.equal(call.stderr, '', 'oracle must not narrate a guessed result on stderr');
  const answer = JSON.parse(call.stdout);
  assert.deepEqual(Object.keys(answer), outputKeys, 'output field order/schema drift');
  assert.equal(answer.schema, 'pareto-oracle-v2.output.v1');
  assert.equal(answer.inputSha256, hash(Buffer.from(raw)));
  return { answer, rawOutput: call.stdout };
}
function run(input, expectedExit = 0) { return runRaw(JSON.stringify(input), expectedExit); }

const metric = (value, unit, evidenceTier = 'synthetic-same-anchor', basisId = 'fixture') =>
  ({ value, unit, evidenceTier, basisId });
function input(caseId, objectives, rows, invalidPolicy = 'reject-row', maxPairChecks = 44850) {
  const descriptors = objectives.map(([key, direction, unit]) => ({key,direction,unit,
    evidenceTier:'synthetic-same-anchor',basisId:'fixture'}));
  return {schema:'pareto-oracle-v2.input.v1',caseId,objectives:descriptors,invalidPolicy,maxPairChecks,
    rows:rows.map(row => ({id:row.id,feasible:row.feasible,
      feasibilityEvidenceId:`fixture:${caseId}:${row.id}`,
      measurements:Object.fromEntries(descriptors.map(o => [o.key,metric(row[o.key],o.unit)]))}))};
}
const unitByKey = {quality:'score',cost:'credits',latency:'ms',reliability:'fraction',accuracy:'points',
  risk:'points',value:'points',benefit:'points'};
function fromFrozen(fixture) {
  return input(fixture.caseId, fixture.objectives.map(o => [o.key,o.direction,unitByKey[o.key]]),
    fixture.rows, fixture.invalidPolicy);
}

// These are literal independently reviewed expectations, not results produced by the candidate.
// A named fixture witness is mathematically valid but need not be the canonical earliest one.
const literal = [
  ['equal-first', 'ok', ['E2','E3','E5'], {E1:'E2',E4:'E2'}, [], []],
  ['duplicate-vectors', 'ok', ['D1','D2','D4'], {D3:'D1',D5:'D1'}, [], []],
  ['reversed-directions', 'ok', ['R1','R2','R4','R5'], {R3:'R1',R6:'R1'}, [], []],
  ['three-objectives', 'ok', ['T3','T4','T5'], {T1:'T5',T2:'T5',T6:'T3'}, [], []],
  ['nonfinite-reject', 'ok', ['N1','N4'], {N5:'N1'}, ['N2','N3'], []],
  ['nonfinite-no-policy', 'hold', [], {}, [], []],
  ['infeasible-before-frontier', 'ok', ['F2','F4','F5'], {F3:'F2'}, [], ['F1','F6']],
];
function assertDominatesLiterally(fixture, dominatorId, dominatedId) {
  const a = fixture.rows.find(row => row.id === dominatorId);
  const b = fixture.rows.find(row => row.id === dominatedId);
  assert.ok(a?.feasible && b?.feasible, `witness/target eligibility: ${dominatorId}/${dominatedId}`);
  const oriented = fixture.objectives.map(o => (o.direction === 'max' ? a[o.key] - b[o.key] : b[o.key] - a[o.key]));
  assert.ok(oriented.every(delta => delta >= 0) && oriented.some(delta => delta > 0),
    `${dominatorId} does not strictly dominate ${dominatedId}`);
}
for (const [caseId,status,frontierIds,canonicalWitnesses,invalidIds,infeasibleIds] of literal) {
  test(`frozen ${caseId}: literal frontier and disjoint partitions`, () => {
    const fixture = frozenCases.get(caseId);
    assert.ok(fixture, `missing frozen case ${caseId}`);
    const {answer} = run(fromFrozen(fixture), status === 'ok' ? 0 : 2);
    assert.equal(answer.caseId, caseId);
    assert.equal(answer.status, status);
    assert.deepEqual(answer.frontierIds, frontierIds);
    assert.deepEqual(answer.invalidIds, invalidIds);
    assert.deepEqual(answer.infeasibleIds, infeasibleIds);
    assert.deepEqual(Object.fromEntries(answer.dominated.map(row => [row.id,row.witnessId])), canonicalWitnesses);
    if (status === 'hold') {
      assert.equal(answer.reasonCode, 'invalid-policy-undeclared');
      assert.equal(answer.eligibleCount, null);
      assert.equal(answer.pairChecks, 0);
      return;
    }
    assert.equal(answer.reasonCode, null);
    const assigned = [...answer.frontierIds,...answer.dominated.map(row => row.id),
      ...answer.invalidIds,...answer.infeasibleIds];
    assert.equal(new Set(assigned).size, fixture.rows.length);
    assert.deepEqual(new Set(assigned), new Set(fixture.rows.map(row => row.id)));
    for (const row of answer.dominated) {
      assert.ok(answer.frontierIds.includes(row.witnessId), 'only retained witnesses allowed');
      assertDominatesLiterally(fixture,row.witnessId,row.id);
    }
    // The independent review chose one valid witness per target. T6's T5 is
    // valid even though this oracle's stated earliest-retained choice is T3.
    for (const [id, witnessId] of Object.entries(fixture.expected.dominated)) {
      assert.ok(answer.frontierIds.includes(witnessId));
      assertDominatesLiterally(fixture,witnessId,id);
    }
  });
}

test('identical eligible vectors retain separate IDs and one pair check', () => {
  const data=input('all-equal',[['value','max','points'],['cost','min','credits']],
    [{id:'A',value:5,cost:2,feasible:true},{id:'B',value:5,cost:2,feasible:true}]);
  const {answer}=run(data);
  assert.deepEqual(answer.frontierIds,['A','B']);
  assert.deepEqual(answer.dominated,[]);
  assert.equal(answer.pairChecks,1);
});

test('a later stronger row dominates both earlier duplicate IDs', () => {
  const data=input('later-dominator',[['value','max','points'],['cost','min','credits']],
    [{id:'A',value:5,cost:5,feasible:true},{id:'B',value:5,cost:5,feasible:true},
      {id:'C',value:6,cost:4,feasible:true}]);
  const {answer}=run(data);
  assert.deepEqual(answer.frontierIds,['C']);
  assert.deepEqual(answer.dominated,[{id:'A',witnessId:'C'},{id:'B',witnessId:'C'}]);
  assert.equal(answer.pairChecks,3);
});

test('hard infeasibility excludes an otherwise stronger row before numeric checks', () => {
  const data=input('hard-gate',[['value','max','points'],['cost','min','credits']],
    [{id:'X',value:null,cost:null,feasible:false},{id:'Y',value:3,cost:8,feasible:true}]);
  data.rows[0].measurements={};
  const {answer}=run(data);
  assert.deepEqual(answer.frontierIds,['Y']);
  assert.deepEqual(answer.infeasibleIds,['X']);
  assert.deepEqual(answer.invalidIds,[]);
  assert.equal(answer.eligibleCount,1);
});

test('an absent feasible measurement is invalid under reject-row policy', () => {
  const data=input('missing-reject',[['value','max','points'],['cost','min','credits']],
    [{id:'X',value:5,cost:2,feasible:true},{id:'Y',value:4,cost:3,feasible:true}]);
  delete data.rows[0].measurements.cost;
  const {answer}=run(data);
  assert.deepEqual(answer.invalidIds,['X']);
  assert.deepEqual(answer.frontierIds,['Y']);
  assert.deepEqual(answer.dominated,[]);
});

test('a nonfinite marker holds the entire case under hold policy', () => {
  const data=input('nonfinite-hold',[['value','max','points'],['cost','min','credits']],
    [{id:'X',value:'Infinity',cost:2,feasible:true},{id:'Y',value:4,cost:3,feasible:true}], 'hold');
  const {answer}=run(data,2);
  assert.equal(answer.status,'hold');
  assert.equal(answer.reasonCode,'invalid-measurement');
  assert.deepEqual(answer.frontierIds,[]);
  assert.deepEqual(answer.invalidIds,[]);
});

test('an unsafe integer is invalid rather than rounded into a comparison', () => {
  const data=input('unsafe-integer',[['value','max','points'],['cost','min','credits']],
    [{id:'X',value:9007199254740992,cost:1,feasible:true},{id:'Y',value:2,cost:2,feasible:true}]);
  const {answer}=run(data);
  assert.deepEqual(answer.invalidIds,['X']);
  assert.deepEqual(answer.frontierIds,['Y']);
});

for (const [field,wrong] of [['unit','seconds'],['evidenceTier','vendor-estimate'],['basisId','other-cohort']]) {
  test(`${field} mismatch holds the entire comparison`, () => {
    const data=input(`mismatch-${field}`,[['value','max','points'],['cost','min','credits']],
      [{id:'X',value:5,cost:2,feasible:true},{id:'Y',value:4,cost:3,feasible:true}]);
    data.rows[1].measurements.value[field]=wrong;
    const {answer}=run(data,2);
    assert.equal(answer.status,'hold');
    assert.equal(answer.reasonCode,'measurement-not-comparable');
    assert.deepEqual(answer.frontierIds,[]);
  });
}

test('missing numeric value cannot hide a mismatched unit under reject-row policy', () => {
  const data=input('missing-with-wrong-unit',[['value','max','points'],['cost','min','credits']],
    [{id:'X',value:null,cost:2,feasible:true},{id:'Y',value:4,cost:3,feasible:true}]);
  data.rows[0].measurements.value.unit='seconds';
  const {answer}=run(data,2);
  assert.equal(answer.reasonCode,'measurement-not-comparable');
  assert.deepEqual(answer.invalidIds,[]);
});

test('missing numeric value cannot hide an extra measurement field', () => {
  const data=input('missing-with-extra-key',[['value','max','points'],['cost','min','credits']],
    [{id:'X',value:null,cost:2,feasible:true},{id:'Y',value:4,cost:3,feasible:true}]);
  delete data.rows[0].measurements.value.value;
  data.rows[0].measurements.value.compositeScore=99;
  const {answer}=run(data,2);
  assert.equal(answer.reasonCode,'invalid-measurement-schema');
  assert.deepEqual(answer.frontierIds,[]);
});

test('duplicate IDs hold even when their vectors differ', () => {
  const data=input('duplicate-id',[['value','max','points'],['cost','min','credits']],
    [{id:'X',value:5,cost:2,feasible:true},{id:'X',value:4,cost:3,feasible:true}]);
  const {answer}=run(data,2);
  assert.equal(answer.reasonCode,'duplicate-row-id');
  assert.deepEqual(answer.frontierIds,[]);
});

test('an ID cannot smuggle a composite or winner into the output', () => {
  const data=input('id-injection',[['value','max','points'],['cost','min','credits']],
    [{id:'Blue - weighted winner',value:5,cost:2,feasible:true}]);
  const {answer}=run(data,2);
  assert.equal(answer.reasonCode,'invalid-row-id');
  assert.ok(!JSON.stringify(answer).includes('weighted winner'));
});

test('pair budget holds before doing any comparison and exact edge passes', () => {
  const data=input('budget-edge',[['value','max','points'],['cost','min','credits']],
    [{id:'A',value:5,cost:3,feasible:true},{id:'B',value:4,cost:2,feasible:true},
      {id:'C',value:3,cost:4,feasible:true}]);
  data.maxPairChecks=2;
  const held=run(data,2).answer;
  assert.equal(held.reasonCode,'pair-budget-exceeded');
  assert.equal(held.pairChecks,0);
  data.maxPairChecks=3;
  const passed=run(data).answer;
  assert.equal(passed.pairChecks,3);
  assert.deepEqual(passed.frontierIds,['A','B']);
  assert.deepEqual(passed.dominated,[{id:'C',witnessId:'A'}]);
});

test('zero rows and one row have stable zero-pair results', () => {
  const empty=input('empty',[['value','max','points'],['cost','min','credits']],[], 'reject-row',0);
  const singleton=input('singleton',[['value','max','points'],['cost','min','credits']],
    [{id:'Only',value:5,cost:2,feasible:true}], 'reject-row',0);
  assert.deepEqual(run(empty).answer.frontierIds,[]);
  const one=run(singleton).answer;
  assert.deepEqual(one.frontierIds,['Only']);
  assert.equal(one.pairChecks,0);
});

test('invalid objective direction and missing feasibility evidence hold', () => {
  const data=input('bad-schema',[['value','max','points'],['cost','min','credits']],
    [{id:'A',value:5,cost:2,feasible:true}]);
  data.objectives[0].direction='higher';
  assert.equal(run(data,2).answer.reasonCode,'invalid-objective');
  data.objectives[0].direction='max';
  data.rows[0].feasibilityEvidenceId='';
  assert.equal(run(data,2).answer.reasonCode,'invalid-feasibility');
});

test('malformed JSON and oversized input hold without a guessed frontier', () => {
  const broken=runRaw('{"schema":',2).answer;
  assert.equal(broken.status,'hold');
  assert.equal(broken.reasonCode,'invalid-json');
  const large=runRaw(' '.repeat(1048577),2).answer;
  assert.equal(large.reasonCode,'input-too-large');
  assert.deepEqual(large.frontierIds,[]);
});

test('duplicate JSON object keys hold before a later value silently replaces a measurement', () => {
  const data=input('duplicate-json-key',[['value','max','points'],['cost','min','credits']],
    [{id:'A',value:5,cost:2,feasible:true},{id:'B',value:4,cost:3,feasible:true}]);
  const raw=JSON.stringify(data);
  const key='"value":{\"value\":5,\"unit\":\"points\",\"evidenceTier\":\"synthetic-same-anchor\",\"basisId\":\"fixture\"}';
  assert.ok(raw.includes(key));
  const ambiguous=raw.replace(key,`${key},${key}`);
  const {answer}=runRaw(ambiguous,2);
  assert.equal(answer.status,'hold');
  assert.equal(answer.reasonCode,'duplicate-json-key');
  assert.deepEqual(answer.frontierIds,[]);
  const escapedAlias=key.replace('"value":','"\\u0076alue":');
  const alias=runRaw(raw.replace(key,`${key},${escapedAlias}`),2).answer;
  assert.equal(alias.reasonCode,'duplicate-json-key');
});

test('hard 300-row quadratic ceiling admits exactly 44,850 pairs and rejects row 301', () => {
  const rows=Array.from({length:300},(_,index)=>({id:`R${index}`,value:5,cost:2,feasible:true}));
  const data=input('quadratic-ceiling',[['value','max','points'],['cost','min','credits']],rows);
  const accepted=run(data).answer;
  assert.equal(accepted.pairChecks,44850);
  assert.equal(accepted.frontierIds.length,300);
  assert.deepEqual(accepted.dominated,[]);
  data.rows.push(input('extra',[['value','max','points'],['cost','min','credits']],
    [{id:'R300',value:5,cost:2,feasible:true}]).rows[0]);
  const held=run(data,2).answer;
  assert.equal(held.reasonCode,'row-limit-exceeded');
  assert.equal(held.pairChecks,0);
});

test('file-argument CLI binds exact example bytes and emits the literal crossed frontier', () => {
  const filename=path.join(here,'example-input.json');
  const call=spawnSync(process.execPath,[oracle,filename],{encoding:'utf8',timeout:5000});
  assert.equal(call.error,undefined);
  assert.equal(call.status,0,call.stderr);
  assert.equal(call.stderr,'');
  const answer=JSON.parse(call.stdout);
  assert.equal(answer.inputSha256,hash(readFileSync(filename)));
  assert.equal(answer.status,'ok');
  assert.deepEqual(answer.frontierIds,['A','B']);
  assert.deepEqual(answer.dominated,[{id:'C',witnessId:'A'}]);
  assert.equal(answer.pairChecks,3);
});

test('bounded exhaustive three-row direction grid agrees with a separate direct definition', async () => {
  const {evaluate}=await import('./pareto-oracle.mjs');
  const vectors=[];
  for (const value of [0,1,2]) for (const cost of [0,1,2]) vectors.push({value,cost});
  const ids=['A','B','C'];
  let checked=0;
  for (const valueDirection of ['max','min']) for (const costDirection of ['max','min']) {
    const descriptors=[['value',valueDirection,'points'],['cost',costDirection,'credits']];
    const directlyDominates=(a,b) => {
      const orientation=[valueDirection === 'max' ? a.value-b.value : b.value-a.value,
        costDirection === 'max' ? a.cost-b.cost : b.cost-a.cost];
      return orientation.every(delta => delta >= 0) && orientation.some(delta => delta > 0);
    };
    for (const first of vectors) for (const second of vectors) for (const third of vectors) {
      const plain=[first,second,third];
      const data=input('exhaustive-grid',descriptors,plain.map((row,index) =>
        ({id:ids[index],...row,feasible:true})), 'reject-row',3);
      const answer=evaluate(data);
      const expected=ids.filter((_,index) =>
        !plain.some((other,j) => j !== index && directlyDominates(other,plain[index])));
      assert.equal(answer.status,'ok');
      assert.deepEqual(answer.frontierIds,expected);
      for (const entry of answer.dominated) {
        const target=ids.indexOf(entry.id);
        const firstRetained=expected.find(id => directlyDominates(plain[ids.indexOf(id)],plain[target]));
        assert.equal(entry.witnessId,firstRetained);
      }
      assert.equal(answer.frontierIds.length+answer.dominated.length,3);
      checked++;
    }
  }
  assert.equal(checked,2916);
});

test('identical input bytes give identical output bytes and bind the raw digest', () => {
  const data=input('stable',[['value','max','points'],['cost','min','credits']],
    [{id:'A',value:5,cost:2,feasible:true},{id:'B',value:4,cost:3,feasible:true}]);
  const raw=JSON.stringify(data);
  const first=runRaw(raw,0);
  const second=runRaw(raw,0);
  assert.equal(first.rawOutput,second.rawOutput);
  assert.equal(first.answer.inputSha256,hash(Buffer.from(raw)));
});

test('a matching 129-character nonempty unit is comparable within the raw-input budget', () => {
  const data=input('long-unit',[['value','max','points'],['cost','min','credits']],
    [{id:'A',value:5,cost:2,feasible:true},{id:'B',value:4,cost:3,feasible:true}]);
  const longUnit='u'.repeat(129);
  data.objectives[0].unit=longUnit;
  for (const row of data.rows) row.measurements.value.unit=longUnit;
  const {answer}=run(data);
  assert.equal(answer.status,'ok');
  assert.deepEqual(answer.frontierIds,['A']);
  assert.deepEqual(answer.dominated,[{id:'B',witnessId:'A'}]);
});

test('a matching 129-character nonempty evidence ID is accepted', () => {
  const data=input('long-evidence',[['value','max','points'],['cost','min','credits']],
    [{id:'A',value:5,cost:2,feasible:true}]);
  data.rows[0].feasibilityEvidenceId='e'.repeat(129);
  const {answer}=run(data);
  assert.equal(answer.status,'ok');
  assert.deepEqual(answer.frontierIds,['A']);
});

test('whitespace-only declaration is still rejected, not made valid by removing the cap', () => {
  const data=input('blank-evidence',[['value','max','points'],['cost','min','credits']],
    [{id:'A',value:5,cost:2,feasible:true}]);
  data.rows[0].feasibilityEvidenceId='   ';
  assert.equal(run(data,2).answer.reasonCode,'invalid-feasibility');
});
