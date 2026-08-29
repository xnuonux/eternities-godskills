import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { writeJsonAtomic } from "../src/io.mjs";
import { buildUniversalOperationalRecordSet } from "../src/universal-operational-definitions.mjs";

const root = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const wave = JSON.parse(await readFile(path.join(root, "data/universal-capability-wave.v1.json"), "utf8"));
const records = buildUniversalOperationalRecordSet(wave);
const output = path.join(root, "data/operational-capabilities.v1.json");
if (process.argv.includes("--write")) await writeJsonAtomic(output, records);
process.stdout.write(`${JSON.stringify({ output: path.relative(root, output).replaceAll("\\", "/"), recordCount: records.records.length, sourceWaveDigest: records.sourceWaveDigest }, null, 2)}\n`);
