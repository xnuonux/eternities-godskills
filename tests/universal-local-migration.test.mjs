import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,symlink,lstat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';

test('Windows migration moves only seven legacy junctions and can restore them',{skip:process.platform!=='win32'},async()=>{
  const root=await mkdtemp(join(tmpdir(),'godskills-links-'));
  const skills=join(root,'agent-skills'),legacy=join(root,'legacy'),archive=join(root,'archive');
  const ids=['eternities-aegis','eternities-architect','eternities-forge','eternities-mnemosyne','eternities-muse','eternities-oracle','sovereign-skill-refinery'];
  await mkdir(skills);await mkdir(legacy);
  for(const id of ids){await mkdir(join(legacy,id));await writeFile(join(legacy,id,'SKILL.md'),'legacy '+id);await symlink(join(legacy,id),join(skills,id),'junction');}
  await mkdir(join(skills,'unrelated'));await writeFile(join(skills,'unrelated','SKILL.md'),'keep');
  const run=mode=>execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',resolve('scripts/migrate-local-godskill-junctions.ps1'),'-Mode',mode,'-SkillsDirectory',skills,'-LegacyRepositorySkills',legacy,'-ArchiveDirectory',archive],{windowsHide:true,encoding:'utf8'});
  run('Archive');
  for(const id of ids){assert.equal((await lstat(join(archive,id))).isSymbolicLink(),true);assert.equal(await readFile(join(legacy,id,'SKILL.md'),'utf8'),'legacy '+id);}
  assert.equal(await readFile(join(skills,'unrelated','SKILL.md'),'utf8'),'keep');
  run('Restore');for(const id of ids)assert.equal((await lstat(join(skills,id))).isSymbolicLink(),true);
});
