import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {searchCatalogIntake} from '../src/catalog-skill-classification.mjs';
const dir=fileURLToPath(new URL('../data/quarry-intake-2026-09-21-catalog801/',import.meta.url));
const options={};
for(let i=2;i<process.argv.length;i++){
  const key=process.argv[i];assert(['--query','--domain','--limit'].includes(key)&&process.argv[i+1]!==undefined,'Use --query TEXT [--domain DOMAIN] [--limit 1..5]');
  options[key.slice(2)]=key==='--limit'?Number(process.argv[++i]):process.argv[++i];
}
const [sourcesBytes,queueBytes,manifestBytes,summaryBytes]=await Promise.all(['sources.jsonl','refinement-queue.jsonl','manifest.json','classification-summary.json'].map(x=>readFile(dir+x)));
const sha=b=>createHash('sha256').update(b).digest('hex'),manifest=JSON.parse(manifestBytes),summary=JSON.parse(summaryBytes);
assert.equal(sha(sourcesBytes),manifest.outputs['sources.jsonl'].sha256);assert.equal(sha(manifestBytes),summary.intakeManifestSha256);assert.equal(sha(queueBytes),summary.queueSha256);
const parse=b=>b.toString().trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
console.log(JSON.stringify({scope:'catalog801 cold source metadata; advisory domains are incomplete',networkCalls:0,classificationComplete:summary.classificationComplete,results:searchCatalogIntake(parse(sourcesBytes),parse(queueBytes),options)},null,2));
