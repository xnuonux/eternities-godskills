import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile,readdir,stat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import * as baseline from '../../../../src/catalog-skill-classification.mjs';
import {evaluate} from './checks.mjs';
const here=fileURLToPath(new URL('.',import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const plan=JSON.parse(await readFile(join(here,'frozen-plan.json')));
for(const [path,digest]of Object.entries(plan.files))assert.equal(sha(await readFile(join(here,path))),digest,`Changed frozen evaluator: ${path}`);
const allowed=['scripts/query-catalog-skill-intake.mjs','src/catalog-query-options.mjs','tests/catalog-summary.test.mjs','docs/catalog-status.md'];
async function inventory(dir,prefix=''){const paths=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=prefix+e.name;assert(!e.isSymbolicLink(),'Unexpected linked output');if(e.isDirectory())paths.push(...await inventory(join(dir,e.name),p+'/'));else paths.push(p);}return paths;}
const results={schema:'godskills-maintenance-results-v1',frozenPlanSha256:sha(await readFile(join(here,'frozen-plan.json'))),arms:{}};
for(const arm of ['a','b']){
  const root=resolve(plan.arms[arm].directory),out=join(here,'runs',arm);await mkdir(out,{recursive:true});
  const paths=await inventory(root),changes=[],violations=[];
  for(const path of paths){
    const digest=sha(await readFile(join(root,path))),old=plan.arms[arm].inputs[path];
    if(digest!==old){changes.push(path);if(!allowed.includes(path)&&path!=='final.txt')violations.push(path);}
  }
  for(const path of Object.keys(plan.arms[arm].inputs))if(!paths.includes(path))violations.push('missing:'+path);
  const outputs={};
  for(const path of [...allowed,'final.txt','guidance.md','task.md','prompt.txt'])if(paths.includes(path)){
    const name=path.replaceAll('/','__').replace('.test.mjs','.test.txt');
    await copyFile(join(root,path),join(out,name));outputs[name]=sha(await readFile(join(out,name)));
  }
  const checks=await evaluate(root,baseline);
  results.arms[arm]={checks,changes,violations,outputs,finalFileModified:paths.includes('final.txt')?(await stat(join(root,'final.txt'))).mtime.toISOString():null};
}
await writeFile(join(here,'result.json'),JSON.stringify(results,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(results,null,2));
