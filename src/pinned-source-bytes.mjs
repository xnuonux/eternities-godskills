import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
const run=promisify(execFile);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

// Recover a declared historic snapshot without rewinding a shared warehouse checkout.
// No fetch, source execution, checkout, or repair of the recorded digest occurs.
export async function readPinnedSourceBytes(record) {
  if(!/^[a-f0-9]{40}$/.test(record.head??''))throw new Error('Exact source commit required');
  if(typeof record.sourcePath!=='string'||!record.sourcePath||/[\\:]/.test(record.sourcePath)||record.sourcePath.split('/').some(x=>!x||x==='.'||x==='..'))throw new Error('Unsafe source path');
  if(!/^[a-f0-9]{64}$/.test(record.bodySha256??''))throw new Error('Exact source digest required');
  const absolute=resolve(record.sourceAbsolutePath), suffix=record.sourcePath.split('/').join(sep);
  if(!absolute.endsWith(sep+suffix))throw new Error('Source path does not match recorded absolute path');
  try{const current=await readFile(absolute);if(sha(current)===record.bodySha256)return current;}catch(e){if(e.code!=='ENOENT')throw e;}
  const root=absolute.slice(0,-suffix.length);
  const {stdout}=await run('git',['--no-pager','-C',root,'show',`${record.head}:${record.sourcePath}`],{encoding:'buffer',maxBuffer:16*1024*1024,windowsHide:true,timeout:10000});
  if(sha(stdout)===record.bodySha256)return stdout;
  // Historic Windows acquisition used CRLF checkout bytes. Accept that encoding
  // only when it reproduces the already-recorded digest exactly.
  const crlf=Buffer.from(stdout.toString('utf8').replaceAll('\r\n','\n').replaceAll('\n','\r\n'));
  if(sha(crlf)===record.bodySha256)return crlf;
  throw new Error('Exact declared source digest cannot be recovered from pinned Git bytes');
}
