import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeJsonAtomic } from "../src/io.mjs";
import { buildUniversalExtensionDefinitions } from "../src/universal-extension-definitions.mjs";

const root = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const wave = JSON.parse(await readFile(path.join(root, "data/universal-capability-wave.v1.json"), "utf8"));
const definitions = buildUniversalExtensionDefinitions(wave);
if (process.argv.includes("--write")) await writeJsonAtomic(path.join(root, "data/godskill-extensions.v1.json"), definitions);
process.stdout.write(`${JSON.stringify({ extensionCount: definitions.extensions.length, sourceWaveDigest: definitions.sourceWaveDigest }, null, 2)}\n`);
