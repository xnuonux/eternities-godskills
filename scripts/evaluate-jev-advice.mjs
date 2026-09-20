// Explicit, bounded research run. Never imported by the runtime router.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256 } from '../src/io.mjs';
import { prepareAdvice, acceptAdvice } from '../src/jev-advisory-selection.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const live = process.argv.includes('--live');
const out = process.argv.find(x => x.startsWith('--out='))?.slice(6);
if (!out) throw new Error('Pass a NEW --out=directory; no existing run is overwritten');
const directory = path.resolve(out);
const key = process.env.TYPESAFE_API_KEY ?? process.env.JEV_API_KEY;
if (live && !key) throw new Error('Missing API key environment variable');
const taskBytes = await readFile(path.join(root, 'data/jev-advisory-selection-v1/tasks.json'), 'utf8');
const cardBytes = await readFile(path.join(root, 'artifacts/routing/cards.jsonl'), 'utf8');
const cases = JSON.parse(taskBytes).cases;
const cards = cardBytes.trim().split(/\r?\n/).map(JSON.parse);
if (cases.length > 20) throw new Error('Maximum 20 cases');
const requests = cases.map(c => prepareAdvice({ task: c.task, cards, model: 'jev-1.13.0' }));
// Maximum 20 sequential calls, <=100KB each, no retries. Dollar figure is an
// estimate from input pricing, not a provider-enforced account spending cap.
if (requests.some(r => Buffer.byteLength(JSON.stringify(r.body)) > 100000)) throw new Error('Request exceeds byte bound');
await mkdir(directory); // EEXIST prevents accidental replay of an interrupted run.
await writeFile(path.join(directory, 'manifest.json'), JSON.stringify({ started: new Date().toISOString(), live, taskSha256: sha256(taskBytes), cardSha256: sha256(cardBytes), requests, cases }, null, 2));
const results = [];
for (let i = 0; i < cases.length; i++) {
  const c = cases[i], r = requests[i];
  let response = null, error = null, latencyMs = null;
  if (live && r.needsRemote) {
    await writeFile(path.join(directory, `${c.id}.reserved.json`), JSON.stringify({ digest: r.digest, at: new Date().toISOString() }), { flag: 'wx' });
    const start = performance.now();
    try {
      const http = await fetch('https://api.typesafe.ai/v1/systemone', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(r.body), signal: AbortSignal.timeout(15000) });
      if (!http.ok) throw new Error(`HTTP ${http.status}`);
      response = await http.json();
    } catch (e) { error = e.name === 'TimeoutError' ? 'timeout' : /^HTTP \d+$/.test(e.message) ? e.message : 'transport-or-parse-error'; }
    latencyMs = performance.now() - start;
  }
  const advice = acceptAdvice(r, response ? { ...response, requestDigest: r.digest } : null);
  const baseline = r.candidates[0]?.id ?? null;
  const usable = advice.status === 'advisory' || ['abstained', 'no-candidates'].includes(advice.reason);
  const row = { id: c.id, expected: c.expected, baseline, baselineCorrect: c.expected.includes(baseline), shortlistRecall: c.expected.includes(null) || r.candidates.some(x => c.expected.includes(x.id)), advice, adviceCorrect: live && usable && c.expected.includes(advice.candidateId), response, error, latencyMs };
  results.push(row);
  await writeFile(path.join(directory, `${c.id}.result.json`), JSON.stringify(row, null, 2));
}
const summary = { live, count: results.length, calls: results.filter(r => r.latencyMs !== null).length, baselineCorrect: results.filter(r => r.baselineCorrect).length, adviceCorrect: live ? results.filter(r => r.adviceCorrect).length : null, shortlistRecall: results.filter(r => r.shortlistRecall).length, errors: results.filter(r => r.error).length, inputTokens: results.reduce((n,r) => n + (r.response?.usage?.input_tokens ?? 0),0), results };
await writeFile(path.join(directory, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ ...summary, results: summary.results.map(({id, baseline, advice, adviceCorrect}) => ({id, baseline, choice:advice.candidateId, reason:advice.reason, adviceCorrect})) }, null, 2));
