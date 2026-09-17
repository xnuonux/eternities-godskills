import { open } from 'node:fs/promises';
import path from 'node:path';
import { verifyEffectOnlyV2Result } from '../src/effect-intent-v2.mjs';

// Separate read-only entrypoint: frozen routing code/receipts stay unchanged.
// Host pins this source closure and validates the parent before isolated launch.
async function boundedJson(file, limit) {
  const handle = await open(file, 'r');
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > limit) throw new Error('input exceeds regular-file/size limit');
    const buffer = Buffer.alloc(limit + 1);
    let length = 0;
    while (length < buffer.length) {
      const {bytesRead} = await handle.read(buffer, length, buffer.length - length, null);
      if (bytesRead === 0) break;
      length += bytesRead;
    }
    if (length > limit) throw new Error('input exceeds size limit');
    try {
      return JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(buffer.subarray(0,length)));
    } catch {
      throw new Error('input must be valid UTF-8 JSON');
    }
  } finally {
    await handle.close();
  }
}

async function main(argv) {
  const limits = new Map([['--request',1024*1024],['--expected-source',1024*1024],['--result',2*1024*1024]]);
  const args = new Map();
  for (let i=0; i<argv.length; i+=2) {
    const flag=argv[i], value=argv[i+1];
    if (!limits.has(flag) || args.has(flag) || !value || value.startsWith('--')) {
      throw new Error('requires unique --request, --expected-source and --result paths');
    }
    args.set(flag,path.resolve(value));
  }
  if (args.size!==3) throw new Error('requires --request, --expected-source and --result');
  const [request,expectedSource,result] = await Promise.all(
    [...limits].map(([flag,limit])=>boundedJson(args.get(flag),limit)),
  );
  try {
    // Pure recomputation validates exact saved values. It does not publish a
    // new route or confer authority: needs-decision pairs also verify.
    verifyEffectOnlyV2Result({request,expectedSource,result});
  } catch {
    throw new Error('stored result or source verification mismatch');
  }
}

try {
  await main(process.argv.slice(2));
} catch (error) {
  console.error(`effect-only-verifier-v2: ${error.code ? `input operation failed (${error.code})` : error.message}`);
  process.exitCode=1;
}
