import { randomUUID } from 'node:crypto';
import { link, mkdir, open, realpath, unlink } from 'node:fs/promises';
import path from 'node:path';
import { compileAndRouteEffectOnlyV2 } from '../src/effect-intent-v2.mjs';

const INPUT_LIMIT = 1024 * 1024;
const OUTPUT_LIMIT = 2 * 1024 * 1024;

async function readBoundedJson(file) {
  const handle = await open(file, 'r');
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > INPUT_LIMIT) throw new Error('input exceeds file/size limit');
    const buffer = Buffer.alloc(INPUT_LIMIT + 1);
    let length = 0;
    while (length < buffer.length) {
      const {bytesRead} = await handle.read(buffer, length, buffer.length - length, null);
      if (bytesRead === 0) break;
      length += bytesRead;
    }
    if (length > INPUT_LIMIT) throw new Error('input exceeds file/size limit');
    try {
      return JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(buffer.subarray(0,length)));
    } catch {
      throw new Error('input must be valid UTF-8 JSON');
    }
  } finally {
    await handle.close();
  }
}

async function publishExclusive(output, result) {
  const bytes = Buffer.from(`${JSON.stringify(result, null, 2)}\n`);
  if (bytes.length > OUTPUT_LIMIT) throw new Error('output exceeds size limit');
  await mkdir(path.dirname(output), {recursive:true});
  const temporary = path.join(path.dirname(output), `.effect-only-${randomUUID()}.tmp`);
  const handle = await open(temporary, 'wx');
  try {
    try { await handle.writeFile(bytes); } finally { await handle.close(); }
    // Same-directory hard-link publication is atomic and refuses an existing
    // destination. No rename-overwrite, partial destination, fallback or retry.
    await link(temporary, output);
  } finally {
    await unlink(temporary);
  }
}

// The host verifies a separately pinned executable source closure BEFORE
// spawning this process. Running this CLI is not producer authentication.
async function main(argv) {
  const flags = ['--request', '--expected-source', '--output'];
  const parsed = new Map();
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (!flags.includes(flag) || parsed.has(flag) || !value || value.startsWith('--')) {
      throw new Error('requires unique --request, --expected-source and --output paths');
    }
    parsed.set(flag, path.resolve(value));
  }
  if (parsed.size !== flags.length) throw new Error('requires --request, --expected-source and --output');
  const identity = value => process.platform === 'win32' ? value.toLowerCase() : value;
  const inputs = await Promise.all(flags.slice(0,2).map(flag => realpath(parsed.get(flag))));
  let outputIdentity;
  try {
    outputIdentity = await realpath(parsed.get('--output'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    outputIdentity = parsed.get('--output');
  }
  if (inputs.some(input => identity(input) === identity(outputIdentity))) {
    throw new Error('output must not overwrite an input');
  }
  const [request, expectedSource] = await Promise.all(inputs.map(readBoundedJson));
  let result;
  try {
    result = compileAndRouteEffectOnlyV2({request, expectedSource});
  } catch {
    throw new Error('request validation or source binding mismatch');
  }
  await publishExclusive(parsed.get('--output'), result);
}

try {
  await main(process.argv.slice(2));
} catch (error) {
  // JSON/context errors can embed private input. Only our fixed messages or a
  // system error code leave this process, never arbitrary body or stack text.
  console.error(`effect-only-v2: ${error.code ? `operation failed (${error.code})` : error.message}`);
  process.exitCode = 1;
}
