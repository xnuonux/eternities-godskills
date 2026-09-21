import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {searchCatalog} from '../product/lib/product.mjs';
const base=new URL('../product/skills/',import.meta.url);
async function catalog(){
  const rows=[];
  for(const id of (await readdir(base)).sort()){
    const item=JSON.parse(await readFile(new URL(`${id}/skill.json`,base),'utf8'));
    rows.push({...item,entrypoint:`skills/${id}/SKILL.md`,entrypointSha256:'0'.repeat(64)});
  }
  return {schema:'eternities-godskills-catalog-v1',skills:rows};
}

const cases=[
  ['Retry a rate limited API request without charging a customer twice','api-rate-limit-recovery'],
  ['Audio DSP creates clicks at sample rate changes and feedback explodes','audio-dsp-integrity-review'],
  ['Protect spreadsheet formulas while editing workbook input cells','formula-preserving-workbook-engineering'],
  ['Review track changes in a DOCX package and render the final document','docx-package-redline-and-render-verification'],
  ['Test genomic assembly coordinates before comparing variants','genomic-coordinate-assembly-and-variant-gates'],
  ['Keyboard focus and bidirectional localization in an Arabic interface','interface-localization-and-bidirectionality'],
  ['Plan a startup venture and find evidence that would falsify demand','venture-falsification-and-planning'],
  ['Gracefully shut down a service while in flight requests settle','bounded-service-shutdown'],
  ['Design an experiment accounting for confounding and practical effect size','eternities-athena'],
  ['Memory continuity after context compaction without rereading entire history','eternities-mnemosyne'],
  ['Reproduce a production crash and isolate the root cause','eternities-phoenix'],
  ['Frame a compelling article from canon while preserving source truth','eternities-logos'],
  ['Build retrieval grounded answers with citations and test empty or stale evidence','retrieval-grounded-answering'],
  ['Compare raw agents against skill enabled agents with blinded counterbalanced evaluation','counterbalanced-agent-evaluation'],
  ['Storyboard camera coverage on one shared scene timeline without repeating the action','scene-continuity-and-coverage'],
];
for(const [query,id] of cases)test(`offline task lookup exposes ${id} in first three candidates`,async()=>{
  const result=searchCatalog(await catalog(),query,{limit:3});
  assert.ok(result.results.some(x=>x.id===id),JSON.stringify(result.results.map(x=>({id:x.id,score:x.score}))));
});
test('nonsense has no match and task filters constrain returned skills',async()=>{
  const c=await catalog();assert.deepEqual(searchCatalog(c,'zzqv xyzzq plorpf').results,[]);
  const hits=searchCatalog(c,'test software reliability',{taskType:'verify',limit:20}).results;
  assert.ok(hits.length>0);
  for(const hit of hits)assert.ok(c.skills.find(x=>x.id===hit.id).taskTypes.includes('verify'));
});
