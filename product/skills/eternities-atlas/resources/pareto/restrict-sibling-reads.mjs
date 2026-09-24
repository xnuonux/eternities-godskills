import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Test-only package-isolation guard. Keep Node/runtime reads available while
// denying data reads from adjacent review packets during the real regression run.
const packet = path.dirname(fileURLToPath(import.meta.url));
const siblings = path.dirname(packet);
const readFileSync = fs.readFileSync;
fs.readFileSync = function (filename, ...options) {
  if (typeof filename === 'string' && path.isAbsolute(filename)) {
    const resolved = path.resolve(filename);
    const withinSiblings = resolved.startsWith(siblings + path.sep);
    const withinPacket = resolved.startsWith(packet + path.sep);
    if (withinSiblings && !withinPacket) {
      throw new Error(`PACKAGE_READ_OUTSIDE_PACKET: ${resolved}`);
    }
  }
  return readFileSync.call(this, filename, ...options);
};
syncBuiltinESMExports();
