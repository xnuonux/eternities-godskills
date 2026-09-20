import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareAdvice, acceptAdvice } from '../src/jev-advisory-selection.mjs';

const cards = [
  { id: 'security', intent: 'Audit authorization and security boundaries', negativeIntents: ['simple facts'] },
  { id: 'audio', intent: 'Review audio transcription and timelines', negativeIntents: [] },
];
const prepare = (overrides = {}) => prepareAdvice({ task: 'audit security', cards, model: 'jev-1.13.0', ...overrides });
const response = (request, choice = 'c0', confidence = .9) => ({ requestDigest: request.digest, model: 'jev-1.13.0', answers: { selection: { type: 'choice', choice, confidence } } });

test('shortlist ranks relevant cards and includes explicit abstention', () => {
  const r = prepare();
  assert.equal(r.candidates[0].id, 'security');
  assert.ok(r.body.questions.selection.criteria.none);
  assert.equal(acceptAdvice(r, response(r)).candidateId, 'security');
  assert.equal(acceptAdvice(r, response(r)).activationAllowed, false);
});
test('cache identity changes with task, metadata, or exact model', () => {
  const r = prepare();
  for (const other of [prepare({ task: 'review audio' }), prepare({ model: 'jev-2.0.0' }), prepare({ cards: [{ ...cards[0], negativeIntents: ['security'] }, cards[1]] })]) assert.notEqual(r.digest, other.digest);
});
test('malformed, stale, uncertain, out-of-set, and abstaining responses never recommend', () => {
  const r = prepare();
  for (const bad of [null, {}, response(r, 'invented'), response(r, 'none'), response(r, 'c0', .4), response(r, 'c0', '0.9'), response(r, 'c0', NaN), response(r, 'c0', 1.1), { ...response(r), requestDigest: 'stale' }, { ...response(r), model: 'other' }]) {
    const result = acceptAdvice(r, bad);
    assert.equal(result.candidateId, null);
    assert.equal(result.activationAllowed, false);
  }
});
test('unknown task gets no lexical matches, not arbitrary top cards', () => {
  const r = prepare({ task: '2+2' });
  assert.equal(r.candidates.length, 0);
  assert.equal(r.needsRemote, false);
});
test('bounded request rejects ambiguous ids, aliases, oversize input and invalid thresholds', () => {
  for (const options of [{ cards: [cards[0], cards[0]] }, { model: 'jev-latest' }, { task: 'a'.repeat(9000) }, { limit: 0 }, { minimumConfidence: NaN }, { minimumConfidence: 1.1 }]) assert.throws(() => prepare(options));
});
test('mutated prepared requests cannot reuse an old response', () => {
  const r = prepare();
  const old = response(r);
  r.candidates[0].id = 'audio';
  assert.equal(acceptAdvice(r, old).candidateId, null);
});
