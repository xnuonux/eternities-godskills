import { createHash } from 'node:crypto';
import { readFile, writeFile, readdir, lstat, mkdir, cp, rename } from 'node:fs/promises';
import { resolve, relative, join, dirname, parse, isAbsolute } from 'node:path';

const cmp=(a,b)=>a<b?-1:a>b?1:0;
const idPattern=/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const taskTypes=new Set(['research','plan','build','verify','recover','orchestrate','create','communicate']);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const stable=value=>JSON.stringify(value,null,2)+'\n';
const exists=async p=>{try {await lstat(p);return true;}catch(e){if(e.code==='ENOENT')return false;throw e;}};
const readJson=async p=>JSON.parse(await readFile(p,'utf8'));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const check=(condition,message)=>{if(!condition)throw new Error(message);};
const inside=(parent,child)=>{const p=relative(parent,child);return p===''||(!p.startsWith('..')&&!isAbsolute(p));};
const safeRel=p=>typeof p==='string'&&p.length>0&&!p.includes('\\')&&!p.includes(':')&&!p.startsWith('/')&&p.split('/').every(x=>x&&x!=='.'&&x!=='..'&&!/[. ]$|[<>"|?*\x00-\x1f]/.test(x)&&!/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(x));

async function noLinks(path) {
  let current=resolve(path);
  while(true){if(await exists(current))check(!(await lstat(current)).isSymbolicLink(),`Symbolic link path rejected: ${current}`);const up=dirname(current);if(up===current)break;current=up;}
}

async function filesAt(root,prefix='') {
  await noLinks(root);
  const out=[];
  for(const entry of (await readdir(root,{withFileTypes:true})).sort((a,b)=>cmp(a.name,b.name))){
    check(!entry.isSymbolicLink(),`Symbolic link rejected: ${entry.name}`);
    const name=prefix+entry.name;
    check(safeRel(name),`Unsafe path: ${name}`);
    if(entry.isDirectory())out.push(...await filesAt(join(root,entry.name),name+'/'));
    else {check(entry.isFile(),`Not a regular file: ${name}`);out.push(name);}
  }
  const folded=out.map(x=>x.toLowerCase());
  check(new Set(folded).size===folded.length,'Case-colliding paths are not portable');
  return out.sort(cmp);
}

async function inventory(root) {
  const result=Object.create(null);
  for(const path of await filesAt(root))result[path]=hash(await readFile(join(root,path)));
  return result;
}

async function inspectCatalog(root) {
  root=resolve(root);await noLinks(root);
  const skillsRoot=join(root,'skills');
  const entries=(await readdir(skillsRoot,{withFileTypes:true})).sort((a,b)=>cmp(a.name,b.name));
  const skills=[];
  for(const entry of entries){
    check(entry.isDirectory()&&idPattern.test(entry.name),`Invalid skill directory: ${entry.name}`);
    const dir=join(skillsRoot,entry.name), meta=await readJson(join(dir,'skill.json'));
    check(meta.id===entry.name,`Skill ID mismatch: ${entry.name}`);
    for(const field of ['category','summary'])check(typeof meta[field]==='string'&&meta[field].trim().length>0&&meta[field].length<=1000,`Invalid ${field}: ${meta.id}`);
    check(idPattern.test(meta.category),`Invalid category: ${meta.id}`);
    for(const field of ['triggers','antiTriggers','taskTypes','related','resources']){
      check(Array.isArray(meta[field])&&meta[field].every(x=>typeof x==='string'&&x.length>0&&x.length<=500),`Invalid ${field}: ${meta.id}`);
      check(new Set(meta[field]).size===meta[field].length,`Duplicate ${field}: ${meta.id}`);
    }
    check(meta.triggers.length>0&&meta.taskTypes.length>0,`No useful trigger/task: ${meta.id}`);
    check(meta.taskTypes.every(x=>taskTypes.has(x)),`Invalid task type: ${meta.id}`);
    check(meta.maturity==='instruction-reviewed',`Unsupported maturity: ${meta.id}`);
    check(Array.isArray(meta.provenance)&&meta.provenance.length>0&&meta.provenance.every(x=>x&&['kind','source','note'].every(k=>typeof x[k]==='string'&&x[k].length>0)),`Missing provenance: ${meta.id}`);
    const files=await inventory(dir);
    check(Object.keys(files).length<=100,`Too many files: ${meta.id}`);
    const skill=await readFile(join(dir,'SKILL.md'),'utf8');
    const front=/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(skill);
    check(front&&new RegExp(`^name: ["']?${meta.id}["']?\\s*$`,'m').test(front[1]),`Frontmatter name mismatch: ${meta.id}`);
    check(/^description:\s*\S/m.test(front[1]),`Missing description: ${meta.id}`);
    for(const resource of meta.resources)check(safeRel(resource)&&Object.hasOwn(files,resource),`Missing or escaping resource: ${meta.id}/${resource}`);
    for(const file of Object.keys(files)){
      if(!/\.(md|json)$/i.test(file))continue;
      const content=await readFile(join(dir,file),'utf8');
      const nonUrlContent=content.replace(/\bhttps?:\/\/[^\s<>"'`()]+/gi,'');
      check(!/(?:[A-Z]:[\\/]\S|\\\\[^\s\\]+\\|\/(?:Users|home)\/[a-z][^\s/]*\/)/i.test(nonUrlContent),`Machine-local path in ${meta.id}/${file}`);
      if(file.endsWith('.md'))for(const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){
        const target=match[1].split('#')[0];
        if(!target||/^(?:https?:|mailto:)/.test(target))continue;
        const resolved=resolve(dirname(join(dir,file)),target);
        check(inside(dir,resolved)&&await exists(resolved),`Broken or nonlocal resource link: ${meta.id}/${file} -> ${target}`);
      }
    }
    const normalized={id:meta.id,category:meta.category,summary:meta.summary,triggers:meta.triggers,antiTriggers:meta.antiTriggers,taskTypes:meta.taskTypes,related:[...meta.related].sort(cmp),...(meta.specializes?{specializes:meta.specializes}:{}),maturity:meta.maturity,entrypoint:`skills/${meta.id}/SKILL.md`,entrypointSha256:files['SKILL.md'],resources:meta.resources.map(path=>({path:`skills/${meta.id}/${path}`,sha256:files[path]}))};
    skills.push(normalized);
  }
  const ids=new Set(skills.map(x=>x.id));
  for(const item of skills){for(const related of [...item.related,...(item.specializes?[item.specializes]:[])])check(ids.has(related)&&related!==item.id,`Dangling/self relation: ${item.id} -> ${related}`);}
  const catalog={schema:'eternities-godskills-catalog-v1',authority:'none',activation:'none',skills};
  return catalog;
}

export async function buildProduct(root) {
  root=resolve(root);await noLinks(root);
  for(const name of ['catalog.json','INDEX.md','release.json']){
    const path=join(root,name);
    if(await exists(path)){const stat=await lstat(path);check(stat.isFile()&&!stat.isSymbolicLink()&&stat.nlink===1,`Unsafe linked manifest output: ${name}`);}
  }
  await filesAt(root);
  const catalog=await inspectCatalog(root), skills=catalog.skills;
  await writeFile(join(root,'catalog.json'),stable(catalog));
  const lines=['# Godskills directory','','Search metadata first; open the selected skill, then only its needed references. Relationships suggest collaboration, not mandatory loading. All entries are instruction-reviewed; this is not performance qualification.',''];
  for(const category of [...new Set(skills.map(x=>x.category))].sort(cmp)){
    lines.push(`## ${category}`,'');
    for(const item of skills.filter(x=>x.category===category))lines.push(`- [${item.id}](${item.entrypoint}): ${item.summary}${item.specializes?` Specialist of ${item.specializes}.`:''}`);
    lines.push('');
  }
  await writeFile(join(root,'INDEX.md'),lines.join('\n').trimEnd()+'\n');
  const files=await inventory(root);delete files['release.json'];
  const release={schema:'eternities-godskills-release-v1',releaseId:hash(stable(files)),skillCount:skills.length,files};
  await writeFile(join(root,'release.json'),stable(release));
  return release;
}

export async function verifyProduct(root) {
  root=resolve(root);await noLinks(root);
  const release=await readJson(join(root,'release.json'));
  check(release.schema==='eternities-godskills-release-v1'&&release.files&&typeof release.files==='object','Invalid release');
  check(Object.keys(release.files).every(safeRel),'Unsafe release path');
  const actual=await inventory(root);delete actual['release.json'];
  check(same(Object.keys(actual),Object.keys(release.files)),'Release file set changed or undeclared files present');
  check(same(actual,release.files),'Release file digest changed');
  check(hash(stable(actual))===release.releaseId,'Release identity mismatch');
  const catalog=await readJson(join(root,'catalog.json'));
  check(catalog.schema==='eternities-godskills-catalog-v1'&&Array.isArray(catalog.skills)&&catalog.skills.length===release.skillCount,'Catalog count mismatch');
  check(same(catalog,await inspectCatalog(root)),'Catalog does not exactly cover valid skill metadata');
  for(const skill of catalog.skills){check(idPattern.test(skill.id)&&skill.entrypoint===`skills/${skill.id}/SKILL.md`&&actual[skill.entrypoint]===skill.entrypointSha256,'Catalog entrypoint mismatch');}
  return release;
}

export async function verifySkillDirectory(directory,id,release) {
  check(idPattern.test(id),'Invalid skill ID');
  const prefix=`skills/${id}/`;
  const expected=Object.fromEntries(Object.entries(release.files).filter(([path])=>path.startsWith(prefix)).map(([path,digest])=>[path.slice(prefix.length),digest]));
  check(Object.keys(expected).length>0,'Skill missing from release');
  const actual=await inventory(directory);
  check(same(actual,expected),`Staged/installed skill does not match approved release: ${id}`);
  return actual;
}

const stop=new Set('a an the to for of in on at and or with from as by this that it my our your please help want need make use using task work something me can how do is be'.split(' '));
const groups=[['debug','debugging','crash','crashes','broken','failure','failures','fault','diagnose','diagnosis'],['reproduce','reproducible','reproduction'],['write','writing','article','draft','drafting','editorial','narrative','canon'],['performance','slow','latency','speed'],['audio','sound','dsp'],['security','threat','vulnerability'],['deploy','deployment','release','publish'],['test','tests','testing','verify','validation'],['memory','continuity','context'],['design','visual','interface'],['data','dataset','table'],['marketing','growth','conversion'],['mobile','android','ios'],['robot','robotics'],['accessibility','a11y','accessible']];
const words=text=>(text.toLowerCase().normalize('NFKC').match(/[\p{L}\p{N}]+(?:[.+#][\p{L}\p{N}]+)*/gu)||[]).filter(x=>!stop.has(x)&&x.length>1);

export function searchCatalog(catalog,query,{limit=5,category,taskType}={}) {
  check(typeof query==='string'&&query.trim().length>0&&query.length<=4096,'Query must contain 1-4096 characters');
  check(Number.isInteger(limit)&&limit>=1&&limit<=20,'Limit must be an integer from 1 to 20');
  check(catalog.schema==='eternities-godskills-catalog-v1'&&Array.isArray(catalog.skills),'Invalid catalog');
  const base=[...new Set(words(query))], expanded=new Set(base);
  for(const group of groups)if(group.some(x=>expanded.has(x)))for(const word of group)expanded.add(word);
  const docs=catalog.skills.map(item=>({item,fields:[{weight:7,text:item.triggers.join(' ')},{weight:4,text:item.id.replaceAll('-',' ')},{weight:3,text:item.summary},{weight:1,text:item.category.replaceAll('-',' ')+' '+item.taskTypes.join(' ')}]}));
  const documentWords=docs.map(x=>new Set(words(x.fields.map(f=>f.text).join(' '))));
  const frequency=new Map();for(const set of documentWords)for(const term of set)frequency.set(term,(frequency.get(term)||0)+1);
  const candidates=[];
  for(const doc of docs){
    const item=doc.item;if(category&&item.category!==category||taskType&&!item.taskTypes.includes(taskType))continue;
    const normalizedQuery=query.toLowerCase().normalize('NFKC').replace(/\s+/g,' ').trim();
    if(item.antiTriggers.some(text=>normalizedQuery.includes(text.toLowerCase().normalize('NFKC').replace(/\s+/g,' ').trim())))continue;
    let score=0;const matched=new Set();
    for(const field of doc.fields){const tokens=new Set(words(field.text));for(const term of expanded)if(tokens.has(term)){const direct=base.includes(term);score+=field.weight*(direct?1:0.25)*Math.log(1+docs.length/(1+(frequency.get(term)||0)));matched.add(term);}}
    if(query.trim().toLowerCase()===item.id){score+=100;matched.add(item.id);}
    if(!score)continue;
    candidates.push({id:item.id,category:item.category,entrypoint:item.entrypoint,entrypointSha256:item.entrypointSha256,summary:item.summary,maturity:item.maturity,taskTypes:item.taskTypes,antiTriggers:item.antiTriggers,score:Math.round(score*1000)/1000,reasons:[`Matched: ${[...matched].sort(cmp).join(', ')}`],related:item.related,...(item.specializes?{specializes:item.specializes}:{})});
  }
  candidates.sort((a,b)=>b.score-a.score||cmp(a.id,b.id));
  return {schema:'eternities-godskills-discovery-v1',authority:'none',activation:'none',method:'offline-weighted-terms-v1',query,results:candidates.slice(0,limit)};
}

function validateRoots(pack,skillsDir,runtimeDir,backupDir) {
  const roots=[pack,skillsDir,runtimeDir,backupDir].map(x=>resolve(x));
  for(const root of roots)check(root!==parse(root).root,'Drive/filesystem root is not an installation target');
  for(let a=0;a<roots.length;a++)for(let b=a+1;b<roots.length;b++)check(!inside(roots[a],roots[b])&&!inside(roots[b],roots[a]),'Installation roots overlap');
  return roots;
}

async function volume(path){
  let candidate=resolve(path);
  while(!await exists(candidate)){const up=dirname(candidate);check(up!==candidate,'No existing volume ancestor');candidate=up;}
  return (await lstat(candidate)).dev;
}

export async function installProduct(pack,{skillsDir,runtimeDir,backupDir}) {
  check([skillsDir,runtimeDir,backupDir].every(x=>typeof x==='string'&&isAbsolute(x)),'Explicit absolute installation and backup paths required');
  [pack,skillsDir,runtimeDir,backupDir]=validateRoots(resolve(pack),skillsDir,runtimeDir,backupDir);
  for(const path of [skillsDir,runtimeDir,backupDir])await noLinks(path);
  const devices=await Promise.all([skillsDir,runtimeDir,backupDir].map(volume));
  check(new Set(devices).size===1,'Skill, runtime, and backup destinations must be on the same volume');
  const release=await verifyProduct(pack), catalog=await readJson(join(pack,'catalog.json'));
  check(!await exists(backupDir),'Backup directory already exists');
  const before={};
  for(const item of catalog.skills){const dest=join(skillsDir,item.id);before[item.id]=await exists(dest)?await inventory(dest):null;}
  const runtimeBefore=await exists(runtimeDir)?await inventory(runtimeDir):null;
  if(runtimeBefore){
    try{await verifyProduct(runtimeDir);}catch{throw new Error('Existing runtime directory is not an intact Godskills pack; choose a separate empty destination');}
  }
  await mkdir(join(backupDir,'staged-skills'),{recursive:true});
  await mkdir(join(backupDir,'previous-skills'));
  await mkdir(skillsDir,{recursive:true});
  const receiptPath=join(backupDir,'install-receipt.json');
  const receipt={schema:'eternities-godskills-install-v1',status:'staging',pack,skillsDir,runtimeDir,backupDir,releaseId:release.releaseId,previous:before,runtimeBefore,installed:{},completed:[],runtimeMoved:false,runtimeInstalled:false};
  const save=()=>writeFile(receiptPath,stable(receipt));await save();
  for(const item of catalog.skills){await cp(join(pack,'skills',item.id),join(backupDir,'staged-skills',item.id),{recursive:true,errorOnExist:true,force:false});receipt.installed[item.id]=await verifySkillDirectory(join(backupDir,'staged-skills',item.id),item.id,release);}
  await cp(pack,join(backupDir,'staged-runtime'),{recursive:true,errorOnExist:true,force:false});
  check((await verifyProduct(join(backupDir,'staged-runtime'))).releaseId===release.releaseId,'Source release changed during staging');
  // No source deletion: each replacement is a recoverable rename with a journal.
  receipt.status='installing';await save();
  try{
    for(const item of catalog.skills){
      const dest=join(skillsDir,item.id);
      check(same(await exists(dest)?await inventory(dest):null,before[item.id]),`Destination changed during staging: ${item.id}`);
      receipt.current=item.id;receipt.currentMoved=false;await save();
      if(before[item.id]){await rename(dest,join(backupDir,'previous-skills',item.id));receipt.currentMoved=true;await save();}
      await rename(join(backupDir,'staged-skills',item.id),dest);
      receipt.completed.push(item.id);delete receipt.current;delete receipt.currentMoved;await save();
    }
    check(same(await exists(runtimeDir)?await inventory(runtimeDir):null,runtimeBefore),'Runtime destination changed during staging');
    if(runtimeBefore){await rename(runtimeDir,join(backupDir,'previous-runtime'));receipt.runtimeMoved=true;await save();}
    await mkdir(dirname(runtimeDir),{recursive:true});await rename(join(backupDir,'staged-runtime'),runtimeDir);receipt.runtimeInstalled=true;await save();
    for(const item of catalog.skills)check(same(await inventory(join(skillsDir,item.id)),receipt.installed[item.id]),`Installed bytes changed: ${item.id}`);
    check((await verifyProduct(runtimeDir)).releaseId===release.releaseId,'Installed runtime release mismatch');receipt.status='installed';await save();
    return {releaseId:release.releaseId,skillCount:catalog.skills.length,receiptPath};
  }catch(error){receipt.status='interrupted';receipt.error=error.message;await save();throw new Error(`Installation interrupted; originals retained in ${backupDir}. ${error.message}`);}
}

export async function rollbackInstall(receiptPath) {
  receiptPath=resolve(receiptPath);await noLinks(receiptPath);
  const receipt=await readJson(receiptPath);
  check(receipt.schema==='eternities-godskills-install-v1'&&receipt.status==='installed','Only a completed installation can be automatically rolled back; inspect an interrupted journal');
  validateRoots(receipt.pack,receipt.skillsDir,receipt.runtimeDir,receipt.backupDir);
  check(receiptPath===join(resolve(receipt.backupDir),'install-receipt.json'),'Receipt is not in its recorded backup directory');
  for(const path of [receipt.skillsDir,receipt.runtimeDir,receipt.backupDir])await noLinks(path);
  check(Array.isArray(receipt.completed)&&receipt.completed.every(x=>idPattern.test(x))&&new Set(receipt.completed).size===receipt.completed.length,'Invalid installed IDs');
  for(const id of receipt.completed){
    check(same(await inventory(join(receipt.skillsDir,id)),receipt.installed[id]),`Installed skill changed after installation: ${id}`);
    if(receipt.previous[id])check(same(await inventory(join(receipt.backupDir,'previous-skills',id)),receipt.previous[id]),`Backup changed: ${id}`);
  }
  check((await verifyProduct(receipt.runtimeDir)).releaseId===receipt.releaseId,'Runtime changed after installation');
  if(receipt.runtimeBefore)check(same(await inventory(join(receipt.backupDir,'previous-runtime')),receipt.runtimeBefore),'Runtime backup changed');
  const displaced=join(receipt.backupDir,'rolled-back-skills');
  check(!await exists(displaced)&&!await exists(join(receipt.backupDir,'rolled-back-runtime')),'Rollback destination already exists');await mkdir(displaced);
  for(const id of receipt.completed){await rename(join(receipt.skillsDir,id),join(displaced,id));if(receipt.previous[id])await rename(join(receipt.backupDir,'previous-skills',id),join(receipt.skillsDir,id));}
  await rename(receipt.runtimeDir,join(receipt.backupDir,'rolled-back-runtime'));
  if(receipt.runtimeBefore)await rename(join(receipt.backupDir,'previous-runtime'),receipt.runtimeDir);
  receipt.status='rolled-back';await writeFile(receiptPath,stable(receipt));
  return {status:'rolled-back',restored:receipt.completed.length};
}
