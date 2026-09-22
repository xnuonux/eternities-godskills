import assert from 'node:assert/strict';
import {readFile,readdir,readlink,lstat,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {verifyProduct} from '../../../product/lib/product.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const skills='C:/Users/Dom/.agents/skills',runtime='C:/Users/Dom/.agents/godskills';
const output=process.argv[2];assert(output&&resolve(output).includes('wave10-knowledge'),'Use a task-scoped audit output');
const verified=await verifyProduct(runtime),release=JSON.parse(await readFile(join(runtime,'release.json')));
const managed=new Set(Object.keys(release.files).filter(p=>p.startsWith('skills/')).map(p=>p.split('/')[1]));
const mismatches=[];let checked=0;
for(const [path,digest]of Object.entries(release.files))if(path.startsWith('skills/')){
  const relative=path.slice(7),target=join(skills,relative);
  try{assert(!(await lstat(target)).isSymbolicLink());if(sha(await readFile(target))!==digest)mismatches.push(relative);checked++;}catch{mismatches.push(relative);}
}
const unrelated=[];
async function inspect(path,relative){const s=await lstat(path);if(s.isSymbolicLink())unrelated.push([relative,'link',await readlink(path)]);else if(s.isDirectory())for(const name of (await readdir(path)).sort())await inspect(join(path,name),relative+'/'+name);else unrelated.push([relative,'file',sha(await readFile(path))]);}
const extraManaged=[];
async function inspectManaged(path,relative){const s=await lstat(path);if(s.isSymbolicLink()){extraManaged.push(relative);return;}if(s.isDirectory()){for(const name of await readdir(path))await inspectManaged(join(path,name),relative+'/'+name);}else if(!Object.hasOwn(release.files,'skills/'+relative))extraManaged.push(relative);}
let unrelatedEntries=0;
for(const entry of (await readdir(skills)).sort()){if(managed.has(entry))await inspectManaged(join(skills,entry),entry);else{unrelatedEntries++;await inspect(join(skills,entry),entry);}}
const result={schema:'godskills-installed-audit-v1',releaseId:verified.releaseId,checkedSkillFiles:checked,managedMethods:managed.size,mismatches,extraManaged,unrelatedEntries,unrelatedRecords:unrelated.length,unrelatedSha256:sha(JSON.stringify(unrelated))};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result));
assert.equal(mismatches.length,0,'Installed managed files differ from existing runtime');
assert.equal(extraManaged.length,0,'Extra managed files must be preserved explicitly');
