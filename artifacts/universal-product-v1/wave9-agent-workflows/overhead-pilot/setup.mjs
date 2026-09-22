import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join,resolve,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash,randomInt} from 'node:crypto';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('.',import.meta.url));
const destination=resolve(process.argv[2]);
assert.equal(destination,join(tmpdir(),basename(destination)),'Use a direct temporary-directory child');
assert(/^godskills-overhead-pilot-20260922(?:-r\d+)?$/.test(basename(destination)),'Use the reserved fixture name');
const sha=b=>createHash('sha256').update(b).digest('hex');
const baseline=Buffer.concat([await readFile(new URL('../../../../product/skills/eternities-forge/SKILL.md',import.meta.url)),Buffer.from('\n'),await readFile(new URL('../../../../product/skills/eternities-forge/references/methods.md',import.meta.url))]);
const card=await readFile(join(root,'compact-guidance.md'));
await mkdir(destination); // Exclusive creation: never replace an earlier paid run.
const treatment=randomInt(2)===0?'a':'b';const order=randomInt(2)===0?['a','b']:['b','a'];
const common='Read task.md and guidance.md in this fixture directory. Implement the task in runner.mjs. Read no other pre-existing files or directories. You may add focused tests here. No network, external APIs, secrets, agents, installation, or Git operations. Use apply_patch for edits. Verify the result and stop with a concise summary. Do not request a historical timing baseline or fabricate savings. The task and permitted guidance are complete.\n';
const receipt={schema:'godskills-overhead-pilot-v1',createdAt:new Date().toISOString(),treatment,launchOrder:order,model:'mimo-v2.6-pro',provider:'mimo_sgp',reasoning:'medium',maxWorkers:2,wallLimitMinutes:12,attemptsPerArm:1,files:{},arms:{}};
for(const name of ['PLAN.md','task.md','compact-guidance.md','checks.mjs','evaluate.mjs','reference.mjs','starter.mjs','setup.mjs'])receipt.files[name]=sha(await readFile(join(root,name)));
for(const arm of ['a','b']){
  const dir=join(destination,arm);await mkdir(dir);
  for(const [src,dst]of [['task.md','task.md'],['starter.mjs','runner.mjs']])await copyFile(join(root,src),join(dir,dst));
  const guidance=arm===treatment?Buffer.concat([baseline,Buffer.from('\n'),card]):baseline;
  await writeFile(join(dir,'guidance.md'),guidance,{flag:'wx'});await writeFile(join(dir,'prompt.txt'),common,{flag:'wx'});
  receipt.arms[arm]={directory:dir,guidanceSha256:sha(guidance),taskSha256:receipt.files['task.md'],promptSha256:sha(common),starterSha256:receipt.files['starter.mjs']};
}
await writeFile(join(root,'frozen-plan.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({fixture:basename(destination),launchOrder:order,filesFrozen:Object.keys(receipt.files).length,planSha256:sha(await readFile(join(root,'frozen-plan.json')))},null,2));
