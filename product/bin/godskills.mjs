#!/usr/bin/env node
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { buildProduct, verifyProduct, searchCatalog, installProduct, rollbackInstall } from '../lib/product.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const [command,...args]=process.argv.slice(2);
function options(items,allowed){
  const result={};
  for(let n=0;n<items.length;n+=2){const key=items[n];if(!allowed.includes(key)||!items[n+1]||items[n+1].startsWith('--')||Object.hasOwn(result,key))throw new Error(`Invalid option: ${key}`);result[key]=items[n+1];}
  return result;
}
try{
  let result;
  if(command==='build'&&args.length===0)result=await buildProduct(root);
  else if(command==='validate'&&args.length===0){const x=await verifyProduct(root);result={status:'verified-content',releaseId:x.releaseId,skillCount:x.skillCount};}
  else if(command==='search'){
    const [query,...flags]=args, opts=options(flags,['--limit','--category','--task']);
    await verifyProduct(root);
    const catalog=JSON.parse(await readFile(resolve(root,'catalog.json'),'utf8'));
    result=searchCatalog(catalog,query,{limit:opts['--limit']===undefined?5:Number(opts['--limit']),category:opts['--category'],taskType:opts['--task']});
  }else if(command==='install'){
    const opts=options(args,['--skills-dir','--runtime-dir','--backup-dir']);
    result=await installProduct(root,{skillsDir:opts['--skills-dir'],runtimeDir:opts['--runtime-dir'],backupDir:opts['--backup-dir']});
  }else if(command==='rollback'){
    const opts=options(args,['--receipt']);if(!opts['--receipt'])throw new Error('Missing --receipt');result=await rollbackInstall(opts['--receipt']);
  }else throw new Error('Usage: godskills.mjs build | validate | search "task" [--limit 1..20] [--category name] [--task name] | install --skills-dir ABS --runtime-dir ABS --backup-dir ABS | rollback --receipt ABS');
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
}catch(error){process.stderr.write(JSON.stringify({error:error.message})+'\n');process.exitCode=1;}
