import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { searchColdIntakes } from '../src/cold-intake-search.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const options = {};
for (let i=2;i<process.argv.length;i++) {
  const arg=process.argv[i];
  if (!['--query','--facet','--limit'].includes(arg) || process.argv[i+1] === undefined) throw new Error('Use --query TEXT [--facet NAME] [--limit 1..5]');
  options[arg.slice(2)] = arg === '--limit' ? Number(process.argv[++i]) : process.argv[++i];
}
const sources=[], labels=[], inputs=[];
for (const name of (await readdir(path.join(root,'data'))).filter(x=>x.startsWith('quarry-intake-')).sort()) {
  const dir=path.join(root,'data',name), files=await readdir(dir);
  for (const file of ['sources.jsonl','source-cards.json','facets.jsonl'].filter(f=>files.includes(f))) {
    const text=await readFile(path.join(dir,file),'utf8');
    const rows=file.endsWith('.jsonl')?text.trim().split(/\r?\n/).filter(Boolean).map(JSON.parse):JSON.parse(text);
    (file==='facets.jsonl'?labels:sources).push(...rows);inputs.push(`${name}/${file}`);
  }
}
console.log(JSON.stringify({ scope:'registered source intakes, not the certified historical atlas', networkCalls:0, inputs, results:searchColdIntakes(sources,labels,options) },null,2));
