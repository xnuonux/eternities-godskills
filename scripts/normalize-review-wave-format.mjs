import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? ".");
const waveRoot = path.join(root, "reviews", "waves");
let count = 0;
for (const family of (await readdir(waveRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
  const familyRoot = path.join(waveRoot, family.name);
  for (const name of (await readdir(familyRoot)).filter((entry) => entry.endsWith(".json")).sort()) {
    const filePath = path.join(familyRoot, name);
    const value = JSON.parse(await readFile(filePath, "utf8"));
    await writeFile(filePath, JSON.stringify(value, null, 2));
    count += 1;
  }
}
console.log(`normalized ${count} review wave files`);
