import {readFile,readdir,lstat,readlink,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join,dirname} from 'node:path';
const [mode,targetPath,receiptPath]=process.argv.slice(2);
if(!['snapshot','compare'].includes(mode)||!targetPath||!receiptPath)throw new Error('Usage: snapshot|compare skills-directory receipt-path');
const target=resolve(targetPath),receipt=resolve(receiptPath);
async function walk(root,prefix=''){
  const rows={};
  for(const name of (await readdir(root)).sort()){
    const path=join(root,name),key=prefix+name,stat=await lstat(path);
    if(stat.isSymbolicLink()){rows[key]='link:'+await readlink(path);continue;}
    if(stat.isDirectory())Object.assign(rows,await walk(path,key+'/'));
    else rows[key]=createHash('sha256').update(await readFile(path)).digest('hex');
  }
  return rows;
}
const files=await walk(target);
if(mode==='snapshot'){
  await mkdir(dirname(receipt),{recursive:true});
  await writeFile(receipt,JSON.stringify({target,files},null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({status:'snapshotted',files:Object.keys(files).length,receipt}));
}else{
  const before=JSON.parse(await readFile(receipt,'utf8'));
  if(before.target!==target)throw new Error('Audit target mismatch');
  const ids=(await readdir(new URL('../product/skills/',import.meta.url))).sort();
  const covered=new Set(ids),unrelated=Object.entries(before.files).filter(([path])=>!covered.has(path.split('/')[0]));
  const changed=unrelated.filter(([path,digest])=>files[path]!==digest).map(([path])=>path);
  if(changed.length)throw new Error('Unrelated installed files changed: '+changed.join(', '));
  console.log(JSON.stringify({status:'unrelated-files-preserved',checked:unrelated.length,originalFiles:Object.keys(before.files).length,currentFiles:Object.keys(files).length}));
}
