import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { canonicalText, sha256, writeJsonAtomic } from "../src/io.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifact = path.join(root, "artifacts", "muse-v4-experimental");
const skill = canonicalText(await readFile(path.join(artifact, "SKILL.md"), "utf8"));
const skillBytes = Buffer.byteLength(skill);
const packageRecord = {
  schemaVersion: 1,
  id: "muse-v4-realtime-phenomena-candidate",
  active: false,
  requiresExplicitAdoption: true,
  skillSha256: sha256(skill),
  skillBytes,
  supplementBytes: skillBytes,
  estimatedTokens: Math.ceil(skillBytes / 4),
  authority: "host-ceiling",
  solutionSpace: "open-within-acceptance-boundary",
};

if (packageRecord.supplementBytes > 8000 || packageRecord.estimatedTokens > 2000) {
  throw new Error("Muse v4 candidate exceeds the frozen supplement budget");
}

await writeJsonAtomic(path.join(artifact, "package.json"), packageRecord);
console.log(JSON.stringify(packageRecord));
