import test from 'node:test';
import assert from 'node:assert/strict';
import { assessInfrastructureEvidence } from '../src/infrastructure-evidence.mjs';

const digest = 'a'.repeat(64);
const plan = () => ({mode:'plan', subjectDigest:digest, toolVersion:'1.9.0',
  isolated:true, mockedProviders:true, externalEffects:false,
  checks:[{id:'valid',kind:'positive',passed:true,subjectDigest:digest,evidenceDigest:'b'.repeat(64)},
    {id:'invalid',kind:'negative',passed:true,subjectDigest:digest,evidenceDigest:'c'.repeat(64)}]});

test('pure plan evidence can be complete without granting execution or promotion', () => {
  assert.deepEqual(assessInfrastructureEvidence(plan()), {
    status:'evidence-complete', authority:'none', promotion:'experimental', issues:[]});
});
test('missing negative test cannot pass as a complete packet', () => {
  const p=plan(); p.checks.pop();
  assert.ok(assessInfrastructureEvidence(p).issues.includes('negative-check-missing'));
});
test('passing boolean without bound evidence is insufficient', () => {
  const p=plan(); delete p.checks[0].evidenceDigest;
  assert.equal(assessInfrastructureEvidence(p).status,'incomplete');
});
test('failed tests and duplicate case identities cannot pass', () => {
  const p=plan(); p.checks[0].passed=false; p.checks[1].id='valid';
  const r=assessInfrastructureEvidence(p);
  assert.ok(r.issues.includes('check-failed')); assert.ok(r.issues.includes('duplicate-check-id'));
});
test('plan does not imply effect-free execution without explicit isolation and mocks', () => {
  for(const field of ['isolated','mockedProviders']) {
    const p=plan(); p[field]=false;
    assert.equal(assessInfrastructureEvidence(p).status,'incomplete');
  }
  const p=plan(); p.externalEffects=true;
  assert.equal(assessInfrastructureEvidence(p).status,'incomplete');
});
test('apply evidence requires scoped prior authority and completed cleanup, never authorizes apply', () => {
  const p={...plan(),mode:'apply',externalEffects:true,mockedProviders:false,
    authorityRecord:{subjectDigest:digest,reference:'approval/fixture',costOwner:'fixture-owner'},
    cleanup:{passed:true,subjectDigest:digest,evidenceDigest:'d'.repeat(64)}};
  assert.equal(assessInfrastructureEvidence(p).status,'evidence-complete');
  assert.equal(assessInfrastructureEvidence(p).authority,'none');
  p.authorityRecord.subjectDigest='b'.repeat(64);
  assert.equal(assessInfrastructureEvidence(p).status,'incomplete');
});

test('each check must explicitly name the subject, independently of evidence bytes', () => {
  for(const value of [undefined,'f'.repeat(64)]) {
    const p=plan(); p.checks[0].subjectDigest=value;
    assert.ok(assessInfrastructureEvidence(p).issues.includes('check-subject-unbound'));
  }
});
test('cleanup must name the applied subject', () => {
  const p={...plan(),mode:'apply',externalEffects:true,
    authorityRecord:{subjectDigest:digest,reference:'fixture',costOwner:'test'},
    cleanup:{passed:true,evidenceDigest:'d'.repeat(64),subjectDigest:'f'.repeat(64)}};
  assert.ok(assessInfrastructureEvidence(p).issues.includes('cleanup-unproven'));
  delete p.cleanup.subjectDigest;
  assert.ok(assessInfrastructureEvidence(p).issues.includes('cleanup-unproven'));
});
test('unknown declarations cannot hide conflicting effects', () => {
  const p=plan(); p.effects={external:true};
  assert.ok(assessInfrastructureEvidence(p).issues.includes('unknown-packet-field'));
  const q=plan(); q.checks[0].externalEffects=true;
  assert.ok(assessInfrastructureEvidence(q).issues.includes('unknown-check-field'));
});
test('cleanup failure or omission blocks apply completion', () => {
  for(const cleanup of [undefined,{passed:false,evidenceDigest:digest}]) {
    const p={...plan(),mode:'apply',cleanup};
    assert.ok(assessInfrastructureEvidence(p).issues.includes('cleanup-unproven'));
  }
});
test('malformed and ambiguous packets fail closed without throwing', () => {
  for(const p of [null,[],{},'plan',{...plan(),mode:'deploy'},
    {...plan(),checks:[null]}, {...plan(),subjectDigest:'abc'},
    {...plan(),toolVersion:''}]) {
    assert.equal(assessInfrastructureEvidence(p).status,'incomplete');
  }
});
